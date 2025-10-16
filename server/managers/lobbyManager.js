class LobbyManager {
  constructor(io, gameManager) {
    this.lobbies = new Map();
    this.gameManager = gameManager;
    this.io = io;

    console.log("🔧 LobbyManager initialized");
    setInterval(() => this.cleanupLobbies(), 1000 * 60 * 60);

    this.io.on("connection", (socket) => this.handleConnection(socket));
  }

  genCode() {
    let code;
    do {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (this.lobbies.has(code));
    
    console.log(`🔑 Generated new lobby code: ${code}`);
    return code;
  }

  createLobby(creatorId, creatorName, selectedPokemonDetails) {
    const code = this.genCode();
    const lobby = {
      code,
      createdAt: Date.now(),
      ownerId: creatorId,
      players: [
        {
          id: creatorId,
          name: creatorName,
          socketId: null,
          selectedPokemonDetails
        }
      ],
      gameSettings: {
        gameTime: null,
        map: null,
        gameType: null,
        stake: null
      },
      status: "waiting"
    };

    this.lobbies.set(code, lobby);
    console.log(`🎮 Lobby created: ${code} by ${creatorName} (${creatorId})`);
    return code;
  }

  validateLobby(code) {
    const normalizedCode = code.toUpperCase();
    const lobby = this.lobbies.get(normalizedCode);
    console.log(`🔍 Validating lobby ${normalizedCode}:`, lobby ? 'FOUND' : 'NOT FOUND');
    return lobby || null;
  }

  getLobby(code) {
    return this.lobbies.get(code.toUpperCase());
  }

  deleteLobby(code) {
    const lobby = this.lobbies.get(code.toUpperCase());
    if (lobby) {
      this.lobbies.delete(code.toUpperCase());
      console.log(`🗑️ Lobby ${code} deleted`);
      return true;
    }
    return false;
  }

  cleanupLobbies() {
    const now = Date.now();
    let cleaned = 0;
    for (const [code, lobby] of this.lobbies) {
      if (now - lobby.createdAt > 1000 * 60 * 60) {
        this.lobbies.delete(code);
        cleaned++;
        console.log(`🧹 Cleaned up old lobby: ${code}`);
      }
    }
    if (cleaned > 0) console.log(`📊 Total lobbies after cleanup: ${this.lobbies.size}`);
  }

  handleConnection(socket) {
    console.log(`🔌 Socket connected: ${socket.id}`);

    socket.on("joinLobby", (data) => {
      this.joinLobby(socket, data.code, data.playerName, data.playerId, data.selectedPokemonDetails);
    });

    socket.on("sendMessage", (data) => {
      this.sendMessage(socket, data.code, data.message);
    });

    socket.on("updateGameSettings", (data) => {
      this.updateGameSettings(socket, data.code, data.settings);
    });

    socket.on("startGame", (data) => {
      this.startGame(socket, data.code);
    });

    socket.on("leaveLobby", (data) => {
      this.leaveLobby(socket, data.code, data.playerId);
    });

    socket.on("disconnect", (reason) => {
      this.handleDisconnect(socket);
    });
  }

  joinLobby(socket, code, playerName, playerId, selectedPokemonDetails) {
    const lobby = this.validateLobby(code);
    if (!lobby) return socket.emit("lobbyError", "Lobby not found");

    // Check if player already exists in lobby
    const existingPlayerIndex = lobby.players.findIndex(p => p.id === playerId);
    if (existingPlayerIndex !== -1) {
      // Update existing player's socket and Pokémon
      lobby.players[existingPlayerIndex].socketId = socket.id;
      lobby.players[existingPlayerIndex].selectedPokemonDetails = selectedPokemonDetails;
      console.log(`🔄 Player ${playerName} reconnected to lobby ${code}`);
    } else {
      // Add new player - no limit
      lobby.players.push({
        id: playerId,
        name: playerName,
        socketId: socket.id,
        selectedPokemonDetails
      });
      console.log(`✅ Player ${playerName} joined lobby ${code}`);
    }

    socket.join(code);
    socket.emit("lobbyData", lobby);
    this.io.to(code).emit("lobbyUpdate", lobby);
    this.io.to(code).emit("message", `⚡ ${playerName} joined the lobby`);
  }

  leaveLobby(socket, code, playerId) {
    console.log(`🚶 Player ${playerId} leaving lobby ${code}`);

    const lobby = this.validateLobby(code);
    if (!lobby) {
      console.log(`❌ Lobby ${code} not found`);
      return;
    }

    const playerIndex = lobby.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      console.log(`❌ Player ${playerId} not found in lobby ${code}`);
      return;
    }

    const playerName = lobby.players[playerIndex].name;
    lobby.players.splice(playerIndex, 1);
    console.log(`✅ Player ${playerName} removed from lobby ${code}`);

    // Notify other players
    this.io.to(code).emit("message", `🚪 ${playerName} left the lobby`);

    if (playerId === lobby.ownerId && lobby.players.length > 0) {
      // Transfer ownership to next player
      lobby.ownerId = lobby.players[0].id;
      this.io.to(code).emit("message", `👑 ${lobby.players[0].name} is now the lobby owner`);
    }

    if (playerId === lobby.ownerId && lobby.players.length === 0) {
      // Owner left and no players remaining - delete lobby
      this.lobbies.delete(code);
      console.log(`🗑️ Lobby ${code} deleted (owner left, no players)`);
      return;
    }

    socket.leave(code);
    this.io.to(code).emit("lobbyUpdate", lobby);
    console.log(`📢 Lobby ${code} updated (${lobby.players.length} players remaining)`);
  }

  updateGameSettings(socket, code, settings) {
    console.log(`⚙️ Updating settings for lobby ${code}:`, settings);

    const lobby = this.validateLobby(code);
    if (!lobby) return socket.emit("lobbyError", "Lobby not found");

    const player = lobby.players.find(p => p.socketId === socket.id);
    if (!player || player.id !== lobby.ownerId) {
      return socket.emit("lobbyError", "Only lobby owner can change settings");
    }

    lobby.gameSettings = { ...lobby.gameSettings, ...settings };
    this.io.to(code).emit("lobbyUpdate", lobby);
    this.io.to(code).emit("message", "⚙️ Game settings updated");
    console.log(`✅ Settings updated for lobby ${code}:`, lobby.gameSettings);
  }

  // In the startGame method, remove the ready check
startGame(socket, code) {
  console.log(`🎯 Starting game for lobby ${code}`);
  const lobby = this.validateLobby(code);
  if (!lobby) return socket.emit("lobbyError", "Lobby not found");

  const player = lobby.players.find(p => p.socketId === socket.id);
  if (!player || player.id !== lobby.ownerId) {
    return socket.emit("lobbyError", "Only lobby owner can start the game");
  }

  if (lobby.players.length < 2) {
    return socket.emit("lobbyError", "Need at least 2 players to start");
  }

  const required = ["gameTime", "map", "gameType"];
  const missing = required.filter(k => !lobby.gameSettings[k]);
  if (missing.length) {
    return socket.emit("lobbyError", `Please set all game settings: ${missing.join(", ")}`);
  }

  if (lobby.gameSettings.gameType === "rated" && (!lobby.gameSettings.stake || lobby.gameSettings.stake <= 0)) {
    return socket.emit("lobbyError", "Please set a stake amount for rated battles");
  }

  lobby.status = "starting";
  console.log(`🚀 Game starting for lobby ${code} with ${lobby.players.length} players`);

  // Use GameManager to start the game
  this.gameManager.startGame(lobby);

  // Notify players that game is starting
  this.io.to(code).emit("gameStarting", {
    lobbyCode: code,
    settings: lobby.gameSettings,
    players: lobby.players
  });

  // Clean up lobby after game starts
  setTimeout(() => {
    if (this.lobbies.has(code)) {
      this.lobbies.delete(code);
      console.log(`🗑️ Lobby ${code} cleaned up after game start`);
    }
  }, 10000);
}

  sendMessage(socket, code, message) {
    console.log(`💬 Message in ${code}: ${message}`);
    this.io.to(code).emit("message", message);
  }

  handleDisconnect(socket) {
    console.log(`🔌 Handling disconnect for socket: ${socket.id}`);

    for (const [code, lobby] of this.lobbies) {
      const playerIndex = lobby.players.findIndex(p => p.socketId === socket.id);
      if (playerIndex !== -1) {
        const player = lobby.players[playerIndex];
        console.log(`🚶 Player ${player.name} disconnected from lobby ${code}`);
        
        // Remove socket ID but keep player in lobby for potential reconnect
        lobby.players[playerIndex].socketId = null;
        
        this.io.to(code).emit("lobbyUpdate", lobby);
        this.io.to(code).emit("message", `🔌 ${player.name} disconnected`);
        break;
      }
    }
  }
}

module.exports = LobbyManager;