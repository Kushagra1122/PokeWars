import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

const GetFirstPokemon = () => {
  const { token, refreshUser } = useContext(AuthContext);
  const [pokemon, setPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [claimingId, setClaimingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPokemon = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/api/pokemon`);
        const firstClaimable = (res.data.pokemon || []).filter(p => p.isFirstClaim);
        setPokemon(firstClaimable);
      } catch (err) {
        setError("Failed to load Pokémon");
      } finally {
        setLoading(false);
      }
    };
    fetchPokemon();
  }, []);

  const claim = async (id) => {
    if (!token) return navigate("/login");
    setClaimingId(id);
    try {
      await axios.post(
        `${API_BASE}/api/pokemon/claim`,
        { pokemonId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await refreshUser();
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to claim Pokémon");
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-900 via-purple-800 to-blue-800 p-6 md:p-16">
      
      <button
        onClick={() => navigate("/dashboard")}
        className="absolute top-6 left-6 p-3 md:p-4 rounded-full bg-yellow-400 text-blue-900 hover:bg-yellow-300 shadow-md transition-shadow"
      >
        <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      <h1
        className="text-3xl md:text-5xl font-extrabold text-yellow-400 mb-8 md:mb-12 text-center drop-shadow-lg"
        style={{ fontFamily: "Press Start 2P, cursive" }}
      >
        Choose Your First Pokémon!
      </h1>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-xl md:text-2xl text-yellow-400 font-bold animate-pulse">
            Loading Pokémon...
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-xl md:text-2xl text-red-400 font-bold bg-red-900/30 px-6 py-4 rounded-xl text-center">
            {error}
          </div>
        </div>
      ) : !pokemon.length ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-xl md:text-2xl text-gray-300 font-bold text-center">
            No Pokémon available for first claim.
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-6 p-6 md:p-10">
          {pokemon.map((p) => (
            <div
              key={p._id || p.id}
              className="bg-gradient-to-b from-blue-800/70 to-purple-900/70 backdrop-blur-sm rounded-xl p-6 flex flex-col items-center shadow-2xl hover:scale-105 hover:shadow-yellow-400/30 transform transition-all duration-300 border-2 border-yellow-400/30"
            >
              <div
                className="relative mb-4 w-32 h-32 md:w-40 md:h-40"
                style={{
                  backgroundImage: `url(${p.sprite || "/characters/noChar.png"})`,
                  backgroundPosition: "-5px 0px",
                  backgroundSize: "700px 700px",
                  backgroundRepeat: "no-repeat",
                  imageRendering: "pixelated",
                }}
              ></div>

              <div className="text-2xl md:text-3xl font-bold text-yellow-400 mb-2 drop-shadow-lg text-center">
                {p.name}
              </div>

              <div className="px-4 py-1 bg-yellow-400/20 border border-yellow-400 rounded-full mb-4">
                <span className="text-sm font-semibold text-yellow-400 capitalize">{p.type}</span>
              </div>

              {p.baseStats && (
                <div className="w-full bg-blue-900/50 border border-yellow-400/30 rounded-lg p-4 mb-4 space-y-2">
                  {["shootRange", "shootPerMin", "hitPoints", "speed"].map((stat) => (
                    <div key={stat} className="flex justify-between text-yellow-200 font-semibold">
                      <span>
                        {stat === "shootRange"
                          ? "Shoot Range"
                          : stat === "shootPerMin"
                          ? "Shoot / Min"
                          : stat === "hitPoints"
                          ? "HP"
                          : "Speed"}
                      </span>
                      <span className="font-bold text-yellow-400">{p.baseStats[stat]}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => claim(p._id)}
                disabled={!!claimingId}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-yellow-400 text-blue-900 font-bold rounded-xl hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed w-full transform hover:scale-105 shadow-lg transition-all"
              >
                <Star className="w-5 h-5" />
                {claimingId === p._id ? "Claiming..." : "Claim This Pokémon"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GetFirstPokemon;
