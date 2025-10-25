import React, { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, ShoppingCart, Sword, User, Bell, Star } from 'lucide-react';
import { WalletButton } from '../components/Wallet/WalletButton';
import { ReserveBasenameCTA } from '../components/Identity/BasenameDisplay';

export default function Dashboard() {
  const { user, logout, selectedPokemon } = useContext(AuthContext);
  const navigate = useNavigate();

  const doLogout = () => {
    logout();
    navigate('/');
  };

  const hasPokemon = user?.pokemon?.length > 0 || !!selectedPokemon;
  const chosen = selectedPokemon || user?.pokemon?.[0]?.pokemonId;

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-purple-800 to-blue-800 p-6 md:p-16 text-center">
      {/* Top-right icons + Wallet */}
      <div className="absolute top-6 right-6 flex items-center gap-4 md:gap-6">
        <WalletButton />
        {[
          { icon: User, to: '/profile' },
          { icon: Bell, to: '/notifications' },
        ].map(({ icon: IconComponent, to }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="p-3 md:p-4 rounded-full bg-yellow-400 text-blue-900 hover:bg-yellow-300 transition-shadow shadow-md"
          >
            <IconComponent className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        ))}
        <button
          onClick={doLogout}
          className="p-3 md:p-4 rounded-full bg-red-600 text-white hover:bg-red-500 transition-shadow shadow-md"
        >
          <LogOut className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>

      {/* Welcome text */}
      <h2
        className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-yellow-400 mb-20 md:mb-28 drop-shadow-lg"
        style={{ fontFamily: 'Press Start 2P, cursive' }}
      >
        Welcome, {user?.name || 'Trainer'}!
      </h2>

      {/* Basename CTA */}
      <div className="mb-8">
        <ReserveBasenameCTA />
      </div>

      {/* Pokémon Sprite */}
      {hasPokemon && chosen?.sprite && (
        <div className="mb-12 md:mb-16 flex items-center justify-center">
          <div className="relative w-48 h-48 md:w-72 md:h-72 animate-bounce  ">
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `url(${chosen.sprite})`,
                backgroundPosition: '15px 0px',
                backgroundSize: '1000px 1000px',
                backgroundRepeat: 'no-repeat',
                imageRendering: 'pixelated',
              }}
            />
          </div>
        </div>
      )}

      {/* Main buttons */}
      <div className="flex flex-wrap justify-center gap-6 md:gap-10">
        {[
          { icon: ShoppingCart, label: 'Marketplace', to: '/market-place' },
          {
            icon: Star,
            label: hasPokemon ? 'Select Pokémon' : 'Get Your First Pokémon',
            to: hasPokemon ? '/select-pokemon' : '/get-first-pokemon',
          },
          { icon: Sword, label: 'Battle', to: '/battle' },
        ].map(({ icon: Icon, label, to }) => (
          <button
            key={label}
            onClick={() => navigate(to)}
            className="flex items-center justify-center gap-2 md:gap-3 px-8 md:px-10 py-3 md:py-5 bg-yellow-400 text-blue-900 font-bold rounded-xl hover:bg-yellow-300 transform hover:scale-105 shadow-lg transition-all"
          >
            <Icon className="w-5 h-5 md:w-6 md:h-6" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
