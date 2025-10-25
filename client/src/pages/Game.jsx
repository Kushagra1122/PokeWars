import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import AuthContext from '../context/AuthContext';
import { WalletButton } from '../components/Wallet/WalletButton';
import { BasenameDisplay } from '../components/Identity/BasenameDisplay';
import MatchEscrowService from '../services/MatchEscrowService';
import axios from 'axios';

import ChatBox from '../components/Game/ChatBox';
import Leaderboard from '../components/Game/Leaderboard';
import Timer from '../components/Game/Timer';
import MainGame from '../components/Game/MainGame';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

const Game = () => {
  const { code } = useParams();
  const { user } = useContext(AuthContext);
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [socket, setSocket] = useState(null);
  const [signer, setSigner] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [settlementStatus, setSettlementStatus] = useState('');
  const [settlementTxHash, setSettlementTxHash] = useState('');

  // Convert walletClient to ethers signer (ethers v5 compatible)
  useEffect(() => {
    if (!walletClient) {
      setSigner(null);
      return;
    }
    
    const getSigner = async () => {
      try {
        // Use ethers v5 API
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const ethersSigner = provider.getSigner();
        setSigner(ethersSigner);
      } catch (error) {
        console.error('Error getting signer:', error);
        setSigner(null);
      }
    };
    
    getSigner();
  }, [walletClient]);

  useEffect(() => {
    const gameSocket = io(API_BASE, { transports: ['websocket', 'polling'] });
    setSocket(gameSocket);

    gameSocket.on('connect', () => {
      if (user && code) {
        gameSocket.emit('joinGame', { gameCode: code, playerId: user.id });
      }
    });

    // ---- GAME EVENTS ----
    gameSocket.on('gameStarted', (data) => {
      setGameState(data);
      if (data?.timeLeft) setTimeLeft(data.timeLeft);
    });

    gameSocket.on('gameState', (data) => {
      setGameState(data);
      if (data?.timeLeft) setTimeLeft(data.timeLeft);
    });

    gameSocket.on('gameTimer', ({ timeLeft }) => {
      setTimeLeft(timeLeft);
    });

    gameSocket.on('gameEnded', (result) => {
      setGameState((prev) => ({ ...prev, status: 'ended', result }));
    });

    gameSocket.on('gameError', (error) => {
      setMessages((prev) => [
        ...prev,
        { system: true, text: `❌ Error: ${error}` },
      ]);
    });

    // ---- CHAT EVENTS ----
    gameSocket.on('receiveGameMessage', (data) => {
      setMessages((prev) => [
        ...prev,
        { ...data, self: data.playerId === user?.id },
      ]);
    });

    return () => gameSocket.disconnect();
  }, [code, user]);

  // Separate effect for handling rated match settlement modal
  useEffect(() => {
    if (
      gameState?.status === 'ended' &&
      gameState?.settings?.gameType === 'rated'
    ) {
      setShowSettlementModal(true);
    }
  }, [gameState?.status, gameState?.settings?.gameType]);

  const handleSettlement = async () => {
    if (!signer || !gameState?.result) return;

    setSettlementStatus('Getting typed data from server...');

    try {
      // Get canonical typed data from server
      const typedDataResponse = await axios.get(
        `${API_BASE}/api/matches/${gameState.matchId}/typed-data`,
      );
      const typedData = typedDataResponse.data;

      // Update typed data with actual game results
      const winner = gameState.result.winner;
      const winnerUser = gameState.players.find((p) => p.id === winner);
      const scoreA = gameState.result.scores?.[gameState.players[0]?.id] || 0;
      const scoreB = gameState.result.scores?.[gameState.players[1]?.id] || 0;

      typedData.message.winner = winnerUser.address;
      typedData.message.scoreA = scoreA;
      typedData.message.scoreB = scoreB;

      setSettlementStatus('Signing result...');

      // Sign the canonical data (ethers v5 API uses _signTypedData)
      const signature = await signer._signTypedData(
        typedData.domain,
        typedData.types,
        typedData.message,
      );

      setSettlementStatus('Submitting to blockchain...');

      // Submit result to server (which will call the contract)
      const submitResponse = await axios.post(
        `${API_BASE}/api/matches/${gameState.matchId}/result`,
        {
          winnerId: winner,
          scoreA,
          scoreB,
          sigA: address === typedData.message.playerA ? signature : '',
          sigB: address === typedData.message.playerB ? signature : '',
          serverNonce: typedData.message.serverNonce,
        },
      );

      if (submitResponse.data.settleTxHash) {
        setSettlementTxHash(submitResponse.data.settleTxHash);
        setSettlementStatus('Settlement complete!');
      }
    } catch (error) {
      console.error('Settlement failed:', error);
      setSettlementStatus(
        `Settlement failed: ${error.response?.data?.error || error.message}`,
      );
    }
  };

  const closeSettlementModal = () => {
    setShowSettlementModal(false);
    // Navigate back to dashboard or lobby
    window.location.href = '/dashboard';
  };

  return (
    <div className="relative min-h-screen bg-linear-to-br from-blue-900 via-purple-800 to-blue-900 text-yellow-400 overflow-hidden flex flex-col">
      {/* Header with Wallet and Player Info */}
      <div className="flex items-center justify-between p-4 z-20 shrink-0 bg-black/20 backdrop-blur-sm border-b border-yellow-400/30">
        <div className="flex items-center gap-4">
          <div className="text-xl md:text-2xl font-bold">PokéWars</div>
          <div className="text-sm md:text-base text-yellow-200">
            {gameState?.settings?.gameType === 'friendly'
              ? 'Friendly'
              : `Ranked${
                  gameState?.settings?.stake
                    ? ` - ${gameState.settings.stake} ETH`
                    : ''
                }`}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm md:text-base">
            <BasenameDisplay
              address={user?.address}
              fallbackName={user?.name}
              className="text-yellow-300 font-bold"
            />
          </div>
          <WalletButton />
        </div>
      </div>

      {/* Floating panels: Chat, Timer, Leaderboard */}
      <div className="absolute top-20 left-4 right-4 flex flex-wrap justify-between items-start gap-4 z-10">
        <ChatBox
          className="w-full md:w-1/3 max-h-[70vh] overflow-y-auto bg-black/20 p-3 rounded-lg shadow-md"
          messages={messages}
          setMessages={setMessages}
          socket={socket}
          user={user}
          gameCode={code}
        />
        <Timer
          className="text-2xl font-bold text-center bg-black/30 p-3 rounded-lg shadow-md"
          timeLeft={timeLeft}
        />
        <Leaderboard
          className="w-full md:w-1/4 max-h-[70vh] overflow-y-auto bg-black/20 p-3 rounded-lg shadow-md"
          gameState={gameState}
          user={user}
        />
      </div>

      {/* Main Game Area - Fixed to take remaining space */}
      <div className="flex-1 justify-center pt-28 px-4 pb-4 min-h-0">
        <div className=" h-full mx-20 border-2 border-yellow-400 rounded-lg bg-black/20">
          <MainGame gameState={gameState} user={user} socket={socket} />
        </div>
      </div>

      {/* Settlement Modal */}
      {showSettlementModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-linear-to-br from-blue-900 to-purple-900 border-2 border-yellow-400 rounded-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4 text-center">
              Match Settlement
            </h2>

            {gameState?.result && (
              <div className="text-center mb-6">
                <p className="text-yellow-200 mb-2">
                  Winner:{' '}
                  <span className="font-bold text-green-400">
                    {
                      gameState.players.find(
                        (p) => p.id === gameState.result.winner,
                      )?.name
                    }
                  </span>
                </p>
                <p className="text-yellow-200 text-sm">
                  Prize: {gameState.settings.stake * 2} ETH
                </p>
              </div>
            )}

            {!settlementTxHash ? (
              <div className="space-y-4">
                <p className="text-yellow-200 text-center">
                  Sign the match result to release funds from escrow
                </p>

                {settlementStatus && (
                  <p className="text-blue-300 text-center text-sm">
                    {settlementStatus}
                  </p>
                )}

                <button
                  onClick={handleSettlement}
                  disabled={!signer || settlementStatus.includes('Signing')}
                  className="w-full py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-400 disabled:bg-gray-500"
                >
                  {settlementStatus.includes('Signing')
                    ? 'Processing...'
                    : 'Sign & Settle'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-green-400 text-center font-bold">
                  ✅ Settlement Complete!
                </p>
                <p className="text-yellow-200 text-center text-sm mb-4">
                  Transaction: {settlementTxHash.slice(0, 10)}...
                  {settlementTxHash.slice(-8)}
                </p>
                <a
                  href={`https://sepolia.basescan.org/tx/${settlementTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-2 bg-blue-500 text-white text-center font-bold rounded-xl hover:bg-blue-400"
                >
                  View on BaseScan
                </a>
              </div>
            )}

            <button
              onClick={closeSettlementModal}
              className="w-full mt-4 py-2 bg-red-500 text-white font-bold rounded-xl hover:bg-red-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
