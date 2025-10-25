import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import AuthContext from '../context/AuthContext';
import PlayersList from '../components/Waiting/PlayerList.jsx';
import ChatBox from '../components/Waiting/ChatBox.jsx';
import GameSettings from '../components/Waiting/GameSettings.jsx';
import { WalletButton } from '../components/Wallet/WalletButton';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
let socket;

const Waiting = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, selectedPokemon } = useContext(AuthContext);

  const [lobby, setLobby] = useState(null);
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [gameSettings, setGameSettings] = useState({
    gameTime: '',
    map: '',
    gameType: '',
    stake: '',
  });

  const [copied, setCopied] = useState(false);
  const isOwner = lobby?.ownerId === user?.id;

  // --- Initialize Socket & Listeners ---
  useEffect(() => {
    if (!socket) {
      socket = io(API_BASE, { transports: ['websocket', 'polling'] });
    }

    socket.on('connect', () => console.log('✅ Connected:', socket.id));
    socket.on('disconnect', (reason) =>
      console.log('🔌 Disconnected:', reason),
    );
    socket.on('lobbyData', (data) => {
      setLobby(data);
      setGameSettings(data.gameSettings || {});
    });
    socket.on('lobbyUpdate', (data) => {
      setLobby(data);
      setGameSettings(data.gameSettings || {});
    });
    socket.on('message', (msg) => setMessages((prev) => [...prev, msg]));
    socket.on('lobbyError', (msg) => setError(msg));
    socket.on('gameStarting', () => navigate(`/battle/game/${code}`));

    return () => {
      socket.off('lobbyData');
      socket.off('lobbyUpdate');
      socket.off('message');
      socket.off('lobbyError');
      socket.off('gameStarting');
    };
  }, [code, navigate]);

  // --- Join Lobby ---
  useEffect(() => {
    if (!joined && user?.id && user?.name) {
      socket.emit('joinLobby', {
        code,
        playerName: user.name,
        playerId: user.id,
        selectedPokemonDetails: selectedPokemon || null,
      });
      setJoined(true);
    }
  }, [joined, user, code, selectedPokemon]);

  // --- Copy code with temporary tooltip ---
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!lobby)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-800 to-blue-900 text-yellow-300">
        <p>Loading lobby {code}...</p>
        {error && <p className="text-red-400 mt-4">{error}</p>}
      </div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-800 to-blue-900 p-6">
      <div className="w-full max-w-5xl bg-blue-950/90 border border-yellow-400 rounded-3xl shadow-2xl p-6 backdrop-blur-md">
        {/* Lobby Code Top + Wallet */}
        <div className="flex justify-between items-center mb-6 relative">
          <h1
            className="text-3xl md:text-4xl font-extrabold text-yellow-400"
            style={{ fontFamily: 'Press Start 2P, cursive' }}
          >
            Lobby
          </h1>

          <div className="flex items-center gap-3 relative">
            <WalletButton />
            <span className="px-3 py-1  border border-yellow-300 rounded-lg text-yellow-300 font-bold">
              {code}
            </span>
            <button
              onClick={handleCopyCode}
              className="px-3 py-1 rounded-lg bg-yellow-400 text-blue-900 font-bold hover:bg-yellow-300 transition"
            >
              Copy
            </button>
            {copied && (
              <span className="absolute -top-6 right-0 text-sm px-2 py-1 bg-green-500/90 text-white rounded-full animate-pulse">
                Copied!
              </span>
            )}
          </div>
        </div>

        {/* Lobby Content */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-6">
            <PlayersList
              lobby={lobby}
              isOwner={isOwner}
              currentUserId={user.id}
            />
            <ChatBox
              messages={messages}
              setMessage={(msg) =>
                socket.emit('sendMessage', {
                  code,
                  message: `${user.name}: ${msg}`,
                })
              }
            />
          </div>

          <GameSettings
            lobby={lobby}
            isOwner={isOwner}
            gameSettings={gameSettings}
            setGameSettings={setGameSettings}
            onUpdateSettings={(updated) => {
              socket.emit('updateGameSettings', {
                code,
                settings: updated,
              });
            }}
            onStartGame={() => {
              if (lobby.players.length < 2)
                return setError('Need at least 2 players');
              const required = ['gameTime', 'map', 'gameType'];
              const missing = required.filter((k) => !gameSettings[k]);
              if (missing.length)
                return setError(`Set all settings: ${missing.join(', ')}`);
              if (
                gameSettings.gameType === 'rated' &&
                (!gameSettings.stake || gameSettings.stake <= 0)
              )
                return setError('Set valid stake for rated battle');
              socket.emit('startGame', { code });
            }}
            onLeaveLobby={() => {
              socket.emit('leaveLobby', { code, playerId: user.id });
              navigate('/battle');
            }}
          />
        </div>

        {error && (
          <div className="mt-6 px-6 py-3 bg-red-500/20 border border-red-400 rounded-xl text-red-300 font-bold">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default Waiting;
