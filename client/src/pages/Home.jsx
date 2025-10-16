import React, { useContext } from 'react'
import AuthContext from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Joystick } from 'lucide-react'

export default function Home() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-purple-800 to-blue-800 p-6">
      <h1
        className="text-5xl font-extrabold text-yellow-400 mb-8 drop-shadow-lg tracking-widest"
        style={{ fontFamily: 'Press Start 2P, cursive' }}
      >
        Welcome, Adventurer!
      </h1>

      {!user ? (
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 px-8 py-3 bg-yellow-400 text-blue-900 font-bold rounded-xl hover:bg-yellow-300 transition transform hover:scale-105 shadow-lg"
        >
          <Joystick className="w-5 h-5" />
          Connect
        </button>
      ) : (
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-8 py-3 bg-yellow-400 text-blue-900 font-bold rounded-xl hover:bg-yellow-300 transition transform hover:scale-105 shadow-lg"
        >
          <Joystick className="w-5 h-5" />
          Enter Dashboard
        </button>
      )}
    </div>
  )
}
