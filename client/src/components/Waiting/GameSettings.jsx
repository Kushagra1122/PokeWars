import React, { useState, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import MatchEscrowService from '../../services/MatchEscrowService';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

const GameSettings = ({
  lobby,
  isOwner,
  gameSettings,
  setGameSettings,
  onStartGame,
  onLeaveLobby,
  onUpdateSettings, // 👈 new prop from parent
}) => {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [isCreatingEscrow, setIsCreatingEscrow] = useState(false);
  const [escrowError, setEscrowError] = useState('');

  const handleUpdate = (key, value) => {
    if (!isOwner) return;
    const updated = { ...gameSettings, [key]: value };
    setGameSettings(updated);
    onUpdateSettings(updated); // 👈 notify parent to emit
  };

  const createEscrowMatch = async () => {
    console.log('🎮 Start clicked! Checking wallet...', { 
      walletClient: !!walletClient, 
      address, 
      isConnected,
      hasWindowEthereum: !!window.ethereum
    });
    
    // Check multiple wallet indicators for robustness
    if (!isConnected || !address) {
      console.error('❌ Wallet not connected! isConnected:', isConnected, 'address:', address);
      setEscrowError('Please connect your wallet first');
      return;
    }

    if (!window.ethereum) {
      console.error('❌ No ethereum provider found!');
      setEscrowError('Wallet extension not found. Please install Coinbase Wallet.');
      return;
    }

    setIsCreatingEscrow(true);
    setEscrowError('');

    try {
      // Get signer from walletClient (ethers v5 compatible)
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // Find opponent (the other player in lobby)
      // The current user is the owner, find the other player
      const currentUserId = lobby.ownerId;
      const opponent = lobby.players.find((p) => p.id !== currentUserId);
      
      if (!opponent) {
        throw new Error('Need 2 players to start a rated match');
      }
      
      console.log('Creating match with opponent:', opponent);
      
      // Note: opponent.address might not be in lobby data, server will fetch it
      if (!opponent.id) {
        throw new Error('Opponent ID missing');
      }

      // Convert stake to wei (ethers v5 API)
      const stakeWei = ethers.utils.parseEther(gameSettings.stake.toString());

      // Create match record on server
      const response = await axios.post(`${API_BASE}/api/matches/create`, {
        playerBId: opponent.id,
        stakeWei: stakeWei.toString(),
      });

      const { matchId, playerA, playerB } = response.data;

      // Create escrow contract instance
      const escrowService = new MatchEscrowService(signer);

      // Create match onchain
      const tx = await escrowService.createMatch(
        matchId,
        playerA,
        playerB,
        stakeWei,
      );
      console.log('Escrow created:', tx.hash);

      // Update match with tx hash
      await axios.patch(`${API_BASE}/api/matches/${matchId}`, { createTxHash: tx.hash });

      // Proceed to start game
      onStartGame();
    } catch (error) {
      console.error('Escrow creation failed:', error);
      setEscrowError(error.response?.data?.error || error.message);
    } finally {
      setIsCreatingEscrow(false);
    }
  };

  const isRated = gameSettings.gameType === 'rated';
  const canStart = !isRated || (isConnected && !isCreatingEscrow);

  // Debug: Log button state
  useEffect(() => {
    console.log('🔘 Start button state:', { 
      isRated, 
      isConnected, 
      canStart, 
      isCreatingEscrow,
      hasWalletClient: !!walletClient,
      address 
    });
  }, [isRated, isConnected, canStart, isCreatingEscrow, walletClient, address]);

  return (
    <div className="bg-yellow-400/10 border border-yellow-400 rounded-xl p-6">
      <h2 className="text-yellow-200 font-bold mb-4">
        Game Settings {isOwner && '(Owner)'}
      </h2>

      {/* Game Time */}
      <label className="block text-yellow-200 mb-2">Game Time</label>
      <select
        value={gameSettings.gameTime || ''}
        onChange={(e) => handleUpdate('gameTime', e.target.value)}
        disabled={!isOwner}
        className="w-full mb-4 p-2 rounded-lg bg-yellow-400/20 border border-yellow-400 text-blue-900"
      >
        <option value="">Select...</option>
        <option value="3">3 minutes</option>
        <option value="5">5 minutes</option>
        <option value="10">10 minutes</option>
      </select>

      {/* Map Selection */}
      <label className="block text-yellow-200 mb-2">Map</label>
      <select
        value={gameSettings.map || ''}
        onChange={(e) => handleUpdate('map', e.target.value)}
        disabled={!isOwner}
        className="w-full mb-4 p-2 rounded-lg bg-yellow-400/20 border border-yellow-400 text-blue-900"
      >
        <option value="">Select...</option>
        <option value="forest">Forest</option>
        <option value="snow">Snow</option>
        <option value="volcano">Volcano</option>
        <option value="desert">Desert</option>
      </select>

      {/* Game Type */}
      <div className="flex gap-4 mb-4">
        {['friendly', 'rated'].map((type) => (
          <button
            key={type}
            onClick={() => handleUpdate('gameType', type)}
            disabled={!isOwner}
            className={`flex-1 py-2 rounded-xl font-bold transition ${
              gameSettings.gameType === type
                ? type === 'friendly'
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
                : 'bg-yellow-400/20 text-yellow-200 border border-yellow-400'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Stake Input */}
      {gameSettings.gameType === 'rated' && (
        <>
          <label className="block text-yellow-200 mb-2">Stake (ETH)</label>
          <input
            type="number"
            min="0.001"
            step="0.001"
            value={gameSettings.stake || ''}
            onChange={(e) =>
              handleUpdate('stake', parseFloat(e.target.value) || 0)
            }
            disabled={!isOwner}
            className="w-full mb-4 p-2 rounded-lg bg-yellow-400/20 border border-yellow-400 text-blue-900"
          />
          <p className="text-yellow-200 text-sm mb-4">
            ⚠️ Rated matches require ETH staking. Funds are held in escrow and
            paid to the winner.
          </p>
        </>
      )}

      {/* Error Display */}
      {escrowError && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4">
          <p className="text-red-200 text-sm">{escrowError}</p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onLeaveLobby}
          className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-400"
        >
          Leave
        </button>
        {isOwner && (
          <div className="flex-1 relative group">
            <button
              onClick={isRated ? createEscrowMatch : onStartGame}
              disabled={!canStart}
              className={`w-full py-3 font-bold rounded-xl transition ${
                canStart
                  ? isCreatingEscrow
                    ? 'bg-blue-500 text-white animate-pulse'
                    : 'bg-green-500 text-white hover:bg-green-400'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
              title={!canStart ? 'Connect wallet to start rated battle' : ''}
            >
              {isCreatingEscrow ? 'Creating Escrow...' : 'Start'}
            </button>
            {!canStart && (
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs px-3 py-2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Connect wallet to play rated
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameSettings;
