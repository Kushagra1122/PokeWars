import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import AuthContext from '../context/AuthContext';
import { WalletButton } from '../components/Wallet/WalletButton';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
let socket;

const Battle = () => {
  const navigate = useNavigate();
  const [lobbyCode, setLobbyCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const { user, selectedPokemon } = useContext(AuthContext);
  useEffect(() => {
    if (!socket) {
      socket = io(API_BASE, { transports: ['websocket', 'polling'] });
      console.log('🔌 Socket connected to:', API_BASE);
    }

    socket.on('connect', () => console.log('✅ Socket connected:', socket.id));
    socket.on('disconnect', (reason) =>
      console.log('🔌 Socket disconnected:', reason),
    );
    socket.on('lobbyError', (msg) => {
      console.log('❌ Lobby error:', msg);
      setError(msg);
    });

    return () => {
      socket.off('lobbyError');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [user]);

  const handleCreateLobby = async () => {
    if (!user) return setError('Please log in first!');
    setCreating(true);
    setError('');

    try {
      console.log('📝 Creating lobby for:', user.name);

      const res = await fetch(`${API_BASE}/api/lobby`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: user.id,
          creatorName: user.name,
          selectedPokemonDetails: selectedPokemon || null,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      console.log('✅ Lobby created:', data.code);
      navigate(`/battle/lobby/${data.code}`);
    } catch (err) {
      console.error('❌ Lobby creation error:', err);
      setError('Failed to create lobby.');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinLobby = async () => {
    if (!user) return setError('Please log in first!');
    if (!lobbyCode.trim()) return setError('Enter a lobby code!');

    setJoining(true);
    setError('');
    const code = lobbyCode.trim().toUpperCase();

    try {
      console.log('🚪 Validating lobby:', code);
      const res = await fetch(
        `${API_BASE}/api/lobby/${encodeURIComponent(code)}`,
      );

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      console.log('✅ Lobby found:', data);
      navigate(`/battle/lobby/${code}`);
    } catch (err) {
      console.error('❌ Join lobby error:', err);
      setError('Lobby not found or invalid code.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-purple-800 to-blue-800 p-8">
      {/* Wallet button in top right */}
      <div className="absolute top-6 right-6">
        <WalletButton />
      </div>

      <h1
        className="text-4xl md:text-5xl font-extrabold text-yellow-400 mb-10 text-center drop-shadow-lg"
        style={{ fontFamily: 'Press Start 2P, cursive' }}
      >
        Battle Lobby
      </h1>

      <div className="flex flex-col items-center gap-6 w-full max-w-md">
        <button
          onClick={handleCreateLobby}
          disabled={creating || !user}
          className="w-full py-4 bg-yellow-400 text-blue-900 font-bold rounded-xl hover:bg-yellow-300 hover:scale-105 shadow-lg transition-all disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Create Lobby'}
        </button>

        <div className="text-yellow-200 font-bold">OR</div>

        <input
          type="text"
          value={lobbyCode}
          onChange={(e) => setLobbyCode(e.target.value)}
          placeholder="Enter Lobby Code"
          className="w-full px-4 py-3 rounded-xl text-blue-900 font-bold placeholder-yellow-300 bg-yellow-400/20 border border-yellow-400 focus:ring-2 focus:ring-yellow-400 transition"
        />

        <button
          onClick={handleJoinLobby}
          disabled={joining || !user}
          className="w-full py-3 bg-yellow-400 text-blue-900 font-bold rounded-xl hover:bg-yellow-300 hover:scale-105 shadow-lg transition-all disabled:opacity-50"
        >
          {joining ? 'Joining...' : 'Join Lobby'}
        </button>

        {!user && (
          <p className="text-red-300 font-bold text-center">Login required</p>
        )}
        {error && <p className="text-red-300 font-bold text-center">{error}</p>}
      </div>
    </div>
  );
};

export default Battle;
