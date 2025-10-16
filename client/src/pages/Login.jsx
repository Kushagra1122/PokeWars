import React, { useState, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthContext from '../context/AuthContext'
import { LogIn } from 'lucide-react'

export default function Login() {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      await login({ name, password })
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-purple-800 to-blue-800 p-6">
      <div className="bg-blue-950 border-4 border-yellow-400 p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
        <LogIn className="mx-auto w-12 h-12 text-yellow-400 mb-4" />
        <h2 className="text-3xl font-extrabold text-yellow-400 mb-2" style={{ fontFamily: 'Press Start 2P, cursive' }}>
          Welcome Back
        </h2>
        <p className="text-white mb-6">Sign in to your account</p>

        <form onSubmit={submit} className="space-y-4 text-left">
          <label className="block text-yellow-400 text-sm mb-1">Username</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-blue-900 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
            placeholder="Enter your username"
          />

          <label className="block text-yellow-400 text-sm mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-blue-900 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
            placeholder="Enter your password"
          />

          {error && <div className="text-red-500 text-sm bg-red-900/20 p-2 rounded animate-pulse">{error}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 mt-2 bg-yellow-400 text-blue-900 font-bold rounded-lg hover:scale-105 transition transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="text-sm text-white text-center mt-4">
            Don't have an account?{' '}
            <Link to="/signup" className="text-yellow-400 font-bold hover:text-yellow-300">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
