class Game {
  constructor(code, players, settings, mapData, spawnPositions) {
    this.id = code;
    this.code = code;
    this.players = this.initializePlayers(players, spawnPositions);
    this.settings = settings;
    this.mapData = mapData;
    this.status = "running";
    this.createdAt = Date.now();
    this.endedAt = null;
    this.winner = null;
    
    const durationMinutes = Number(settings?.gameTime || 5);
    this.timeLeft = durationMinutes * 60;
    this.timerInterval = null;
  }

  initializePlayers(players, spawnPositions) {
    return players.map((player, index) => ({
      id: player.id,
      name: player.name,
      socketId: player.socketId,
      selectedPokemonDetails: player.selectedPokemonDetails,
      health: 100,
      position: spawnPositions[index] || { x: 0, y: 0 },
      direction: 'down',
      isOnline: true
    }));
  }

  startTimer(onGameEnd, io) {
    console.log(`⏳ Timer started for game ${this.code} (${this.timeLeft}s)`);
    this.io = io; // Store reference to socket.io for timer updates

    this.timerInterval = setInterval(() => {
      this.timeLeft -= 1;

      // Emit timer update to all players in the game
      if (this.io) {
        this.io.to(this.code).emit("gameTimer", { timeLeft: this.timeLeft });
      }

      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;

        const randomWinner = this.players[Math.floor(Math.random() * this.players.length)];
        onGameEnd(this.code, randomWinner?.id || null, "time_up");
      }
    }, 1000);
  }

  getPlayer(playerId) {
    return this.players.find(p => p.id === playerId);
  }

  getPlayerBySocketId(socketId) {
    return this.players.find(p => p.socketId === socketId);
  }

  getAlivePlayers() {
    return this.players.filter(p => p.health > 0);
  }

  updatePlayerPosition(playerId, x, y) {
    const player = this.getPlayer(playerId);
    if (player) {
      player.position = { x, y };
    }
    return player;
  }

  updatePlayerHealth(playerId, newHealth) {
    const player = this.getPlayer(playerId);
    if (player) {
      player.health = Math.max(0, Math.min(100, newHealth));
    }
    return player;
  }

  respawnPlayer(playerId, newPosition) {
    const player = this.getPlayer(playerId);
    if (player) {
      console.log(`🔄 Respawning ${player.name} from ${player.health}HP to 100HP`);
      player.health = 100; // Full health on respawn
      player.position = newPosition; // New spawn position
      player.direction = 'down'; // Reset direction
      console.log(`✅ ${player.name} respawned at (${newPosition.x}, ${newPosition.y}) with ${player.health}HP`);
    }
    return player;
  }

  updatePlayerConnection(playerId, socketId, isOnline) {
    const player = this.getPlayer(playerId);
    if (player) {
      player.socketId = socketId;
      player.isOnline = isOnline;
    }
    return player;
  }

  createMessage(playerId, playerName, text) {
    return {
      playerId,
      playerName,
      text: text.trim(),
      gameCode: this.code,
      timestamp: Date.now(),
      type: 'player'
    };
  }

  createSystemMessage(text) {
    return {
      playerId: 'system',
      playerName: 'System',
      text,
      gameCode: this.code,
      timestamp: Date.now(),
      type: 'system'
    };
  }

  sanitizeForPlayer(currentPlayerId) {
    return {
      id: this.id,
      code: this.code,
      players: this.players.map(player => ({
        id: player.id,
        name: player.name,
        health: player.health,
        selectedPokemonDetails: player.selectedPokemonDetails,
        position: player.position,
        direction: player.direction,
        isOnline: player.isOnline,
        isYou: player.id === currentPlayerId
      })),
      settings: this.settings,
      mapData: this.mapData,
      status: this.status,
      createdAt: this.createdAt,
      timeLeft: this.timeLeft,
      winner: this.winner,
    };
  }

  sanitize() {
    return {
      id: this.id,
      code: this.code,
      players: this.players.map(player => ({
        id: player.id,
        name: player.name,
        health: player.health,
        selectedPokemonDetails: player.selectedPokemonDetails,
        position: player.position,
        direction: player.direction,
        isOnline: player.isOnline
      })),
      settings: this.settings,
      mapData: this.mapData,
      status: this.status,
      createdAt: this.createdAt,
      timeLeft: this.timeLeft,
      winner: this.winner,
    };
  }

  end(winnerId) {
    this.status = "ended";
    this.winner = winnerId;
    this.endedAt = Date.now();

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}

module.exports = Game;