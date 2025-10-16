import React, { useState } from 'react';

const Leaderboard = ({ gameState, user }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Sort players by kills, then by health
  const sortedPlayers = gameState?.players?.slice().sort((a, b) => {
    const aKills = a.stats?.kills || 0;
    const bKills = b.stats?.kills || 0;
    const aDeaths = a.stats?.deaths || 0;
    const bDeaths = b.stats?.deaths || 0;
    
    // Primary sort by kills (descending)
    if (bKills !== aKills) return bKills - aKills;
    
    // Secondary sort by K/D ratio (descending)
    const aKDRatio = aDeaths === 0 ? aKills : aKills / aDeaths;
    const bKDRatio = bDeaths === 0 ? bKills : bKills / bDeaths;
    if (bKDRatio !== aKDRatio) return bKDRatio - aKDRatio;
    
    // Tertiary sort by health (descending)
    return (b.health || 0) - (a.health || 0);
  }) || [];

  const getKDText = (player) => {
    const kills = player.stats?.kills || 0;
    const deaths = player.stats?.deaths || 0;
    return `${kills}/${deaths}`;
  };

  const getKDRatio = (player) => {
    const kills = player.stats?.kills || 0;
    const deaths = player.stats?.deaths || 0;
    if (deaths === 0) return kills === 0 ? '0.00' : kills.toFixed(2);
    return (kills / deaths).toFixed(2);
  };

  return (
    <div className={`bg-gradient-to-b from-black/30 to-black/50 p-4 rounded-xl text-sm flex flex-col backdrop-blur-md border border-yellow-400/20 shadow-lg overflow-y-auto transition-all duration-300 w-1/4 ${
      isCollapsed ? ' h-auto' : 'h-80'
    }`}>

      <div
        className="flex items-center justify-between mb-3 cursor-pointer hover:bg-white/5 rounded-lg p-2 -m-2 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center">
          <span className="text-xl mr-2">🏆</span>
          <h2 className="font-bold text-yellow-300 text-lg">Leaderboard</h2>
        </div>
        <span className={`text-yellow-400 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}>
          ▲
        </span>
      </div>

      {!isCollapsed && (
        <>
          {sortedPlayers.length > 0 ? (
            <div className="space-y-3">
              {sortedPlayers.map((player, idx) => (
                <div key={player.id} className={`p-3 rounded-lg border transition-all duration-200 ${
                  player.id === user?.id 
                    ? 'bg-green-900/30 border-green-500/40 shadow-md' 
                    : player.health <= 0
                    ? 'bg-red-900/30 border-red-500/40'
                    : 'bg-gray-800/30 border-gray-600/30'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`font-bold ${
                        player.id === user?.id 
                          ? 'text-green-400' 
                          : player.health <= 0
                          ? 'text-red-400'
                          : 'text-yellow-200'
                      }`}>
                        #{idx + 1} {player.name}
                      </span>
                      {player.health <= 0 && (
                        <span className="text-xs text-red-400 bg-red-900/50 px-2 py-1 rounded">
                          DEAD
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">K/D: {getKDText(player)}</div>
                      <div className="text-xs text-yellow-400">Ratio: {getKDRatio(player)}</div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-700/50 rounded-full h-2.5 overflow-hidden mb-2">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        player.health > 70 ? 'bg-green-500' :
                        player.health > 30 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${player.health || 0}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>HP: {player.health || 0}%</span>
                    <span>Kills: {player.stats?.kills || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-yellow-200/60 text-center py-8">
              👥 No players yet
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Leaderboard;