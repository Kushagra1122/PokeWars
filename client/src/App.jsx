import './App.css'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import GetFirstPokemon from './pages/GetFirstPokemon'
import SelectPokemon from './pages/SelectPokemon'
import Battle from './pages/Battle'
import Waiting from './pages/Waiting'
import MarketPlace from './pages/MarketPlace'
import Game from './pages/Game'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/get-first-pokemon" element={<GetFirstPokemon />} />
          <Route path="/select-pokemon" element={<SelectPokemon />} />
          <Route path="/battle" element={<Battle />} />
          <Route path="/battle/lobby/:code" element={<Waiting />} /> 
          <Route path="/market-place" element={<MarketPlace />} />
          <Route path="/battle/game/:code" element={<Game />} />
          <Route path="*" element={<div>404 Not Found. Go to <Link to="/">Home</Link></div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
