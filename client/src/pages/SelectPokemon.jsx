import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { Star, ArrowLeft } from "lucide-react";

const StatRow = ({ label, value }) => (
  <div className="flex justify-between text-sm md:text-base text-yellow-200">
    <span>{label}</span>
    <span className="font-bold">{value}</span>
  </div>
);

const SelectPokemon = () => {
  const { user, selectPokemon, selectedPokemon } = useContext(AuthContext);
  const navigate = useNavigate();
  const pokes = user?.pokemon || [];

  const handleSelect = (p) => {
    const payload = { ...p.pokemonId, level: p.level, _id: p._id };
    selectPokemon(payload);
    navigate("/dashboard");
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-900 via-purple-800 to-blue-800 p-6 md:p-16">
      
      {/* Back button */}
      <button
        onClick={() => navigate("/dashboard")}
        className="absolute top-6 left-6 p-3 md:p-4 rounded-full bg-yellow-400 text-blue-900 hover:bg-yellow-300 shadow-md transition-shadow"
      >
        <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {/* Title */}
      <h1
        className="text-3xl md:text-5xl font-extrabold text-yellow-400 mb-8 md:mb-12 text-center drop-shadow-lg"
        style={{ fontFamily: "Press Start 2P, cursive" }}
      >
        Select Your Pokémon
      </h1>

      {/* Pokémon Cards */}
      {pokes.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-xl md:text-2xl text-yellow-200 font-bold text-center">
            You don't have any Pokémon yet. Go to Marketplace or Get First Pokémon.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-6 p-6 md:p-10">
          {pokes.map((p) => {
            const pk = p.pokemonId || {};
            const isSelected =
              selectedPokemon && String(selectedPokemon._id) === String(p._id);

            return (
              <div
                key={p._id}
                className={`bg-gradient-to-b from-blue-800/70 to-purple-900/70 backdrop-blur-sm rounded-xl p-6 flex flex-col items-center shadow-2xl hover:scale-105 hover:shadow-yellow-400/30 transform transition-all border-2 ${
                  isSelected ? "border-yellow-400" : "border-yellow-400/30"
                }`}
              >
                <div
                  className="relative mb-4 w-32 h-32 md:w-40 md:h-40 "
                  style={{
                    backgroundImage: `url(${pk.sprite || "/characters/noChar.png"})`,
                    backgroundPosition: "-5px 0px",
                    backgroundSize: "700px 700px",
                    backgroundRepeat: "no-repeat",
                    imageRendering: "pixelated",
                  }}
                ></div>

                <div className="text-2xl md:text-3xl font-bold text-yellow-400 mb-2 drop-shadow-lg text-center">
                  {pk.name}
                </div>

                <div className="px-4 py-1 bg-yellow-400/20 border border-yellow-400 rounded-full mb-4">
                  <span className="text-sm font-semibold text-yellow-400 capitalize">{pk.type}</span>
                </div>

                <div className="w-full bg-blue-900/50 border border-yellow-400/30 rounded-lg p-4 mb-4 space-y-2">
                  <StatRow label="Shoot Range" value={pk.baseStats?.shootRange ?? "-"} />
                  <StatRow label="Shoot / min" value={pk.baseStats?.shootPerMin ?? "-"} />
                  <StatRow label="HP" value={pk.baseStats?.hitPoints ?? "-"} />
                  <StatRow label="Speed" value={pk.baseStats?.speed ?? "-"} />
                </div>

                <button
                  onClick={() => handleSelect(p)}
                  disabled={isSelected}
                  className={`flex items-center justify-center gap-2 px-6 py-3 bg-yellow-400 text-blue-900 font-bold rounded-xl hover:bg-yellow-300 w-full transform hover:scale-105 shadow-lg transition-all ${
                    isSelected ? "bg-yellow-300 cursor-not-allowed" : ""
                  }`}
                >
                  <Star className="w-5 h-5" />
                  {isSelected ? "Selected" : "Select This Pokémon"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SelectPokemon;
