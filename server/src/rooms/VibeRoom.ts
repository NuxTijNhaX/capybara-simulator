import { Room, Client, matchMaker } from "@colyseus/core";
import { VibeState } from "../schemas/VibeState";
import { Player } from "../schemas/Player";

interface Challenge {
  challengerId: string;
  challengerName: string;
  targetId: string;
  targetName: string;
  timestamp: number;
}

interface CaroGameState {
  playerXId: string;
  playerOId: string;
  playerXName: string;
  playerOName: string;
  board: number[];
  currentTurn: string;
  phase: 'playing' | 'finished';
}

const CARO_BOARD_SIZE = 15;
const CARO_WIN_LENGTH = 5;

// Outfit items pool (random selection for anonymous players)
const OUTFIT_ITEMS = [
  "baseball", "graduation", "hardhat", "pirate", "tophat", "wizard",
  "sunglasses", "flower_crown", "necklace", "backpack"
];

const ANIMAL_NAMES = [
  "Capy", "Chill", "Vibe", "Zen", "Mellow", "Cozy", "Lazy", "Sleepy",
  "Dreamy", "Peaceful", "Calm", "Gentle", "Soft", "Warm", "Fuzzy"
];

export class VibeRoom extends Room<VibeState> {
  maxClients = 50;
  
  // AFK timeout: 5 minutes
  readonly AFK_TIMEOUT = 5 * 60 * 1000;
  
  // Update rate: 20fps (50ms)
  readonly TICK_RATE = 50;

  // Active battleship challenges
  private challenges: Map<string, Challenge> = new Map();

  // Active caro challenges
  private caroChallenges: Map<string, Challenge> = new Map();

// Active caro games
  private caroGames: Map<string, CaroGameState> = new Map();
  private caroPlayerGames: Map<string, string> = new Map();

  onCreate(options: any) {
    this.setState(new VibeState());
    
    // Set simulation interval for state sync
    this.setSimulationInterval((deltaTime) => this.update(deltaTime), this.TICK_RATE);
    
    // Handle player movement
    this.onMessage("move", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.x = data.x;
        player.y = data.y;
        player.z = data.z;
        player.rotationY = data.rotationY;
        player.animation = data.animation;
        player.lastActivity = Date.now();
      }
    });
    
    // Handle chat messages
    this.onMessage("chat", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player && typeof message === 'string') {
        const text = message.substring(0, 120).trim();
        if (text.length > 0) {
          this.broadcast("chat", {
            senderId: client.sessionId,
            senderName: player.name,
            text: text,
            timestamp: Date.now()
          });
          player.lastActivity = Date.now();
        }
      }
    });
    
    // Handle emotes
    this.onMessage("emote", (client, emoteType) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        this.broadcast("emote", {
          senderId: client.sessionId,
          senderName: player.name,
          emote: emoteType,
          timestamp: Date.now()
        }, { except: client });
        player.lastActivity = Date.now();
      }
    });
    
    // Handle mount request (player wants to ride on another player)
    this.onMessage("mount", (client, hostSessionId) => {
      const rider = this.state.players.get(client.sessionId);
      const host = this.state.players.get(hostSessionId);
      
      if (!rider || !host) {
        console.log(`[VibeRoom] Mount failed: player not found`);
        return;
      }
      
      // Validate: rider must not already be riding
      if (rider.ridingOn) {
        console.log(`[VibeRoom] Mount failed: ${rider.name} already riding`);
        return;
      }
      
      // Validate: host must not already be carrying someone
      if (host.carrying) {
        console.log(`[VibeRoom] Mount failed: ${host.name} already carrying someone`);
        return;
      }
      
      // Validate: host must not be riding someone else
      if (host.ridingOn) {
        console.log(`[VibeRoom] Mount failed: ${host.name} is riding someone`);
        return;
      }
      
      // Set riding state
      rider.ridingOn = hostSessionId;
      host.carrying = client.sessionId;
      rider.animation = "sit";
      rider.lastActivity = Date.now();
      host.lastActivity = Date.now();
      
      console.log(`[VibeRoom] ${rider.name} mounted ${host.name}`);
      
      // Broadcast mount event
      this.broadcast("mount", {
        riderId: client.sessionId,
        riderName: rider.name,
        hostId: hostSessionId,
        hostName: host.name
      });
    });
    
    // Handle dismount request
    this.onMessage("dismount", (client) => {
      const rider = this.state.players.get(client.sessionId);
      
      if (!rider || !rider.ridingOn) {
        console.log(`[VibeRoom] Dismount failed: not riding`);
        return;
      }
      
      const hostSessionId = rider.ridingOn;
      const host = this.state.players.get(hostSessionId);
      
      console.log(`[VibeRoom] ${rider.name} dismounted from ${host?.name || 'unknown'}`);
      
      // Clear riding state
      rider.ridingOn = "";
      rider.animation = "idle";
      
      if (host) {
        host.carrying = "";
        host.lastActivity = Date.now();
      }
      
      rider.lastActivity = Date.now();
      
      // Broadcast dismount event
      this.broadcast("dismount", {
        riderId: client.sessionId,
        hostId: hostSessionId
      });
    });
    
    // Handle host dropping rider
    this.onMessage("dropRider", (client) => {
      const host = this.state.players.get(client.sessionId);
      
      if (!host || !host.carrying) {
        console.log(`[VibeRoom] Drop rider failed: not carrying anyone`);
        return;
      }
      
      const riderSessionId = host.carrying;
      const rider = this.state.players.get(riderSessionId);
      
      console.log(`[VibeRoom] ${host.name} dropped ${rider?.name || 'unknown'}`);
      
      // Clear riding state
      host.carrying = "";
      host.lastActivity = Date.now();
      
      if (rider) {
        rider.ridingOn = "";
        rider.animation = "idle";
        rider.lastActivity = Date.now();
      }
      
      // Broadcast dismount event
      this.broadcast("dismount", {
        riderId: riderSessionId,
        hostId: client.sessionId
      });
    });
    
    // Handle battleship challenge request
    this.onMessage("battleshipChallenge", (client, targetSessionId: string) => {
      const challenger = this.state.players.get(client.sessionId);
      const target = this.state.players.get(targetSessionId);
      
      if (!challenger || !target) {
        console.log(`[VibeRoom] Challenge failed: player not found`);
        return;
      }
      
      // Check if either player is already in a game or has pending challenge
      const existingChallenge = Array.from(this.challenges.values()).find(
        c => c.challengerId === client.sessionId || c.targetId === client.sessionId ||
             c.challengerId === targetSessionId || c.targetId === targetSessionId
      );
      
      if (existingChallenge) {
        client.send("challengeError", { message: "Already have pending challenge" });
        return;
      }
      
      const challengeId = `${client.sessionId}_${targetSessionId}_${Date.now()}`;
      const challenge: Challenge = {
        challengerId: client.sessionId,
        challengerName: challenger.name,
        targetId: targetSessionId,
        targetName: target.name,
        timestamp: Date.now()
      };
      
      this.challenges.set(challengeId, challenge);
      console.log(`[VibeRoom] ${challenger.name} challenges ${target.name} to Battleship`);
      
      // Notify target
      const targetClient = this.clients.find(c => c.sessionId === targetSessionId);
      if (targetClient) {
        targetClient.send("battleshipInvite", {
          challengeId,
          challengerId: client.sessionId,
          challengerName: challenger.name
        });
      }
      
      // Notify challenger that invite was sent
      client.send("challengeSent", {
        challengeId,
        targetName: target.name
      });
    });
    
    // Handle challenge accept
    this.onMessage("battleshipAccept", async (client, challengeId: string) => {
      const challenge = this.challenges.get(challengeId);
      
      if (!challenge) {
        client.send("challengeError", { message: "Challenge not found" });
        return;
      }
      
      if (client.sessionId !== challenge.targetId) {
        client.send("challengeError", { message: "Not your challenge to accept" });
        return;
      }
      
      console.log(`[VibeRoom] ${challenge.targetName} accepted challenge from ${challenge.challengerName}`);
      
      try {
        // Create dedicated BattleshipRoom
        const battleRoom = await matchMaker.createRoom('battleship_room', {});
        console.log(`[VibeRoom] Created BattleshipRoom: ${battleRoom.roomId}`);
        
        // Notify both players with roomId
        const challengerClient = this.clients.find(c => c.sessionId === challenge.challengerId);
        
        if (challengerClient) {
          challengerClient.send("battleshipStart", {
            roomId: battleRoom.roomId,
            opponentId: challenge.targetId,
            opponentName: challenge.targetName
          });
        }
        
        client.send("battleshipStart", {
          roomId: battleRoom.roomId,
          opponentId: challenge.challengerId,
          opponentName: challenge.challengerName
        });
        
        this.challenges.delete(challengeId);
      } catch (error) {
        console.error('[VibeRoom] Failed to create BattleshipRoom:', error);
        client.send("challengeError", { message: "Failed to create game room" });
        const challengerClient = this.clients.find(c => c.sessionId === challenge.challengerId);
        if (challengerClient) {
          challengerClient.send("challengeError", { message: "Failed to create game room" });
        }
      }
    });
    
    // Handle challenge decline
    this.onMessage("battleshipDecline", (client, challengeId: string) => {
      const challenge = this.challenges.get(challengeId);
      
      if (!challenge) {
        client.send("challengeError", { message: "Challenge not found" });
        return;
      }
      
      if (client.sessionId !== challenge.targetId) {
        client.send("challengeError", { message: "Not your challenge to decline" });
        return;
      }
      
      console.log(`[VibeRoom] ${challenge.targetName} declined challenge from ${challenge.challengerName}`);
      
      // Notify challenger
      const challengerClient = this.clients.find(c => c.sessionId === challenge.challengerId);
      if (challengerClient) {
        challengerClient.send("challengeDeclined", {
          targetName: challenge.targetName
        });
      }
      
      this.challenges.delete(challengeId);
    });
    
    // Handle challenge cancel
    this.onMessage("battleshipCancel", (client, challengeId: string) => {
      const challenge = this.challenges.get(challengeId);
      
      if (!challenge) return;
      
      if (client.sessionId !== challenge.challengerId) return;
      
      console.log(`[VibeRoom] ${challenge.challengerName} cancelled challenge`);
      this.challenges.delete(challengeId);
    });
    
    // ========================================
    // CARO GAME HANDLERS
    // ========================================
    
    // Handle Caro challenge request
    this.onMessage("caroChallenge", (client, targetSessionId: string) => {
      const challenger = this.state.players.get(client.sessionId);
      const target = this.state.players.get(targetSessionId);
      
      if (!challenger || !target) {
        console.log(`[VibeRoom] Caro challenge failed: player not found`);
        return;
      }
      
      // Check if either player is already in a game or has pending challenge
      const existingChallenge = Array.from(this.caroChallenges.values()).find(
        c => c.challengerId === client.sessionId || c.targetId === client.sessionId ||
             c.challengerId === targetSessionId || c.targetId === targetSessionId
      );
      
      if (existingChallenge) {
        client.send("caroError", { message: "Already have pending challenge" });
        return;
      }
      
      const challengeId = `caro_${client.sessionId}_${targetSessionId}_${Date.now()}`;
      const challenge: Challenge = {
        challengerId: client.sessionId,
        challengerName: challenger.name,
        targetId: targetSessionId,
        targetName: target.name,
        timestamp: Date.now()
      };
      
      this.caroChallenges.set(challengeId, challenge);
      console.log(`[VibeRoom] ${challenger.name} challenges ${target.name} to Caro`);
      
      // Notify target
      const targetClient = this.clients.find(c => c.sessionId === targetSessionId);
      if (targetClient) {
        targetClient.send("caroInvite", {
          challengeId,
          challengerId: client.sessionId,
          challengerName: challenger.name
        });
      }
      
      // Notify challenger that invite was sent
      client.send("caroChallengeSent", {
        challengeId,
        targetName: target.name
      });
    });
    
    // Handle Caro challenge accept
    this.onMessage("caroAccept", (client, challengeId: string) => {
      const challenge = this.caroChallenges.get(challengeId);
      
      if (!challenge) {
        client.send("caroError", { message: "Challenge not found" });
        return;
      }
      
      if (client.sessionId !== challenge.targetId) {
        client.send("caroError", { message: "Not your challenge to accept" });
        return;
      }
      
      console.log(`[VibeRoom] ${challenge.targetName} accepted Caro challenge from ${challenge.challengerName}`);
      
      // Randomly assign pieces
      const isFirst = Math.random() < 0.5;
      const challengerPiece = isFirst ? "X" : "O";
      const targetPiece = isFirst ? "O" : "X";
      const firstTurn = isFirst ? challenge.challengerId : challenge.targetId;
      const gameId = `caro_${challenge.challengerId}_${challenge.targetId}_${Date.now()}`;
      
      // Create game state
      const gameState: CaroGameState = {
        playerXId: isFirst ? challenge.challengerId : challenge.targetId,
        playerOId: isFirst ? challenge.targetId : challenge.challengerId,
        playerXName: isFirst ? challenge.challengerName : challenge.targetName,
        playerOName: isFirst ? challenge.targetName : challenge.challengerName,
        board: new Array(CARO_BOARD_SIZE * CARO_BOARD_SIZE).fill(0),
        currentTurn: firstTurn,
        phase: 'playing'
      };
      
      this.caroGames.set(gameId, gameState);
      this.caroPlayerGames.set(challenge.challengerId, gameId);
      this.caroPlayerGames.set(challenge.targetId, gameId);
      
      // Notify both players
      const challengerClient = this.clients.find(c => c.sessionId === challenge.challengerId);
      
      if (challengerClient) {
        challengerClient.send("caroStart", {
          gameId,
          opponentId: challenge.targetId,
          opponentName: challenge.targetName,
          myPiece: challengerPiece,
          isMyTurn: isFirst
        });
      }
      
      client.send("caroStart", {
        gameId,
        opponentId: challenge.challengerId,
        opponentName: challenge.challengerName,
        myPiece: targetPiece,
        isMyTurn: !isFirst
      });
      
      this.caroChallenges.delete(challengeId);
    });
    
    // Handle Caro challenge decline
    this.onMessage("caroDecline", (client, challengeId: string) => {
      const challenge = this.caroChallenges.get(challengeId);
      
      if (!challenge) {
        client.send("caroError", { message: "Challenge not found" });
        return;
      }
      
      if (client.sessionId !== challenge.targetId) {
        client.send("caroError", { message: "Not your challenge to decline" });
        return;
      }
      
      console.log(`[VibeRoom] ${challenge.targetName} declined Caro challenge from ${challenge.challengerName}`);
      
      // Notify challenger
      const challengerClient = this.clients.find(c => c.sessionId === challenge.challengerId);
      if (challengerClient) {
        challengerClient.send("caroDeclined", {
          targetName: challenge.targetName
        });
      }
      
      this.caroChallenges.delete(challengeId);
    });
    
    // Handle Caro move (server-side validation and win detection)
    this.onMessage("caroMove", (client, data: { row: number; col: number; piece: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      
      // Find the game this player is in
      const gameId = this.caroPlayerGames.get(client.sessionId);
      if (!gameId) {
        client.send("caroError", { message: "You are not in a game" });
        return;
      }
      
      const gameState = this.caroGames.get(gameId);
      if (!gameState || gameState.phase !== 'playing') {
        client.send("caroError", { message: "Game not found or finished" });
        return;
      }
      
      // Validate turn
      if (gameState.currentTurn !== client.sessionId) {
        client.send("caroError", { message: "Not your turn" });
        return;
      }
      
      // Validate bounds
      if (data.row < 0 || data.row >= CARO_BOARD_SIZE || data.col < 0 || data.col >= CARO_BOARD_SIZE) {
        client.send("caroError", { message: "Invalid position" });
        return;
      }
      
      const idx = data.row * CARO_BOARD_SIZE + data.col;
      
      // Validate cell is empty
      if (gameState.board[idx] !== 0) {
        client.send("caroError", { message: "Cell already occupied" });
        return;
      }
      
      // Validate piece matches player
      const expectedPiece = gameState.playerXId === client.sessionId ? 1 : 2;
      const actualPiece = data.piece === 'X' ? 1 : 2;
      if (expectedPiece !== actualPiece) {
        client.send("caroError", { message: "Invalid piece" });
        return;
      }
      
      // Update board
      gameState.board[idx] = actualPiece;
      
      console.log(`[VibeRoom] Caro move: ${player.name} (${data.piece}) at (${data.row}, ${data.col})`);
      
      // Check for win
      const winningCells = this.checkCaroWin(gameState.board, data.row, data.col, actualPiece);
      if (winningCells) {
        gameState.phase = 'finished';
        
        // Broadcast win to both players
        this.broadcast("caroEnd", {
          winner: client.sessionId,
          winnerName: player.name,
          winningCells,
          reason: "win"
        });
        
        // Cleanup game state
        this.caroGames.delete(gameId);
        this.caroPlayerGames.delete(gameState.playerXId);
        this.caroPlayerGames.delete(gameState.playerOId);
        
        console.log(`[VibeRoom] Caro game ended: ${player.name} wins!`);
        return;
      }
      
      // Check for draw
      if (this.checkCaroDraw(gameState.board)) {
        gameState.phase = 'finished';
        
        this.broadcast("caroEnd", {
          winner: null,
          winningCells: [],
          reason: "draw"
        });
        
        this.caroGames.delete(gameId);
        this.caroPlayerGames.delete(gameState.playerXId);
        this.caroPlayerGames.delete(gameState.playerOId);
        
        console.log(`[VibeRoom] Caro game ended in draw`);
        return;
      }
      
      // Switch turn
      const opponentId = gameState.playerXId === client.sessionId 
        ? gameState.playerOId 
        : gameState.playerXId;
      gameState.currentTurn = opponentId;
      
      // Broadcast move to opponent
      const opponentClient = this.clients.find(c => c.sessionId === opponentId);
      if (opponentClient) {
        opponentClient.send("caroMove", {
          row: data.row,
          col: data.col,
          piece: data.piece,
          playerId: client.sessionId,
          playerName: player.name
        });
      }
      
      // Broadcast turn change to both players
      const opponentPlayer = this.state.players.get(opponentId);
      this.broadcast("caroTurnChange", {
        turn: opponentId,
        turnName: opponentPlayer?.name || "Player"
      });
    });
    
    // Handle Caro leave/forfeit
    this.onMessage("caroLeave", (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      
      console.log(`[VibeRoom] ${player.name} left Caro game`);
      
      // Find and cleanup game state
      const gameId = this.caroPlayerGames.get(client.sessionId);
      if (gameId) {
        const gameState = this.caroGames.get(gameId);
        if (gameState) {
          const opponentId = gameState.playerXId === client.sessionId 
            ? gameState.playerOId 
            : gameState.playerXId;
          const opponent = this.state.players.get(opponentId);
          
          // Notify opponent of win
          this.broadcast("caroEnd", {
            winner: opponentId,
            winnerName: opponent?.name || "Player",
            loserId: client.sessionId,
            loserName: player.name,
            reason: "opponent_left"
          });
          
          // Cleanup
          this.caroGames.delete(gameId);
          this.caroPlayerGames.delete(gameState.playerXId);
          this.caroPlayerGames.delete(gameState.playerOId);
        }
      }
    });
    
    // Cleanup expired challenges every 30 seconds
    this.clock.setInterval(() => {
      this.cleanupExpiredChallenges();
    }, 30000);
    
    console.log(`[VibeRoom] Created with maxClients: ${this.maxClients}`);
  }

  onJoin(client: Client, options: any) {
    // Generate random outfit
    const outfit = this.generateRandomOutfit();
    
    // Generate random name
    const name = this.generateRandomName();
    
    const player = new Player();
    player.id = client.sessionId;
    player.name = options.name || name;
    player.outfit = JSON.stringify(outfit);
    
    // Random spawn position within bounds (-20 to 20)
    player.x = (Math.random() - 0.5) * 40;
    player.z = (Math.random() - 0.5) * 40;
    player.y = 0;
    player.animation = "idle";
    
    this.state.players.set(client.sessionId, player);
    this.state.playerCount = this.state.players.size;
    
    // Send welcome message with player data
    client.send("welcome", {
      id: client.sessionId,
      player: {
        name: player.name,
        outfit: player.outfit,
        x: player.x,
        y: player.y,
        z: player.z
      },
      playerCount: this.state.playerCount,
      maxPlayers: this.maxClients
    });
    
    // Notify others
    this.broadcast("playerJoined", {
      id: client.sessionId,
      name: player.name,
      outfit: player.outfit
    }, { except: client });
    
    console.log(`[VibeRoom] ${player.name} joined (${this.state.playerCount}/${this.maxClients})`);
  }

  onLeave(client: Client, consented: boolean) {
    const player = this.state.players.get(client.sessionId);
    if (player) {
      console.log(`[VibeRoom] ${player.name} left`);
      
      // Clean up riding state
      if (player.ridingOn) {
        // Player was riding someone, clear host's carrying
        const host = this.state.players.get(player.ridingOn);
        if (host) {
          host.carrying = "";
        }
      }
      
      if (player.carrying) {
        // Player was carrying someone, clear rider's ridingOn
        const rider = this.state.players.get(player.carrying);
        if (rider) {
          rider.ridingOn = "";
          rider.animation = "idle";
          // Broadcast to rider that they were dropped
          this.broadcast("dismount", {
            riderId: player.carrying,
            hostId: client.sessionId
          });
        }
      }
    }
    
    this.state.players.delete(client.sessionId);
    this.state.playerCount = this.state.players.size;
    
    // Notify others
    this.broadcast("playerLeft", {
      id: client.sessionId
    });
  }

  onDispose() {
    console.log("[VibeRoom] Disposed");
  }

  update(deltaTime: number) {
    // Update server time
    this.state.serverTime = Date.now();
    
    // Sync rider positions with their hosts
    this.state.players.forEach((player, sessionId) => {
      if (player.ridingOn) {
        const host = this.state.players.get(player.ridingOn);
        if (host) {
          // Rider follows host position (server authoritative)
          // Offset: slightly behind and above the host
          player.x = host.x - Math.sin(host.rotationY) * 0.3;
          player.y = host.y + 0.8;
          player.z = host.z - Math.cos(host.rotationY) * 0.3;
          player.rotationY = host.rotationY;
        }
      }
    });
  }

  private cleanupInactivePlayers() {
    const now = Date.now();
    let cleaned = 0;
    
    this.state.players.forEach((player, sessionId) => {
      if (now - player.lastActivity > this.AFK_TIMEOUT) {
        console.log(`[VibeRoom] Kicking AFK player: ${player.name}`);
        
        // Find and disconnect the client
        const client = this.clients.find(c => c.sessionId === sessionId);
        if (client) {
          client.leave();
        }
        cleaned++;
      }
    });
    
    if (cleaned > 0) {
      console.log(`[VibeRoom] Cleaned up ${cleaned} AFK players`);
    }
  }

  private cleanupExpiredChallenges() {
    const now = Date.now();
    const expireTime = 60000; // 1 minute expiry
    
    this.challenges.forEach((challenge, id) => {
      if (now - challenge.timestamp > expireTime) {
        this.challenges.delete(id);
        console.log(`[VibeRoom] Expired challenge: ${challenge.challengerName} vs ${challenge.targetName}`);
      }
    });
    
    this.caroChallenges.forEach((challenge, id) => {
      if (now - challenge.timestamp > expireTime) {
        this.caroChallenges.delete(id);
        console.log(`[VibeRoom] Expired Caro challenge: ${challenge.challengerName} vs ${challenge.targetName}`);
      }
    });
  }

  private generateRandomOutfit(): Record<string, string> {
    const outfit: Record<string, string> = {};
    
    // 70% chance to have a hat
    if (Math.random() < 0.7) {
      outfit.hat = OUTFIT_ITEMS[Math.floor(Math.random() * 6)]; // First 6 are hats
    }
    
    // 40% chance to have accessory
    if (Math.random() < 0.4) {
      outfit.accessory = OUTFIT_ITEMS[6 + Math.floor(Math.random() * 4)]; // Last 4 are accessories
    }
    
    return outfit;
  }

  private generateRandomName(): string {
    const prefix = ANIMAL_NAMES[Math.floor(Math.random() * ANIMAL_NAMES.length)];
    const suffix = Math.floor(Math.random() * 1000);
    return `${prefix}${suffix}`;
  }

  private checkCaroWin(board: number[], row: number, col: number, pieceValue: number): Array<{ row: number; col: number }> | null {
    const directions = [
      [[0, 1], [0, -1]],   // horizontal
      [[1, 0], [-1, 0]],   // vertical
      [[1, 1], [-1, -1]], // diagonal \
      [[1, -1], [-1, 1]]  // diagonal /
    ];

    for (const dirs of directions) {
      const cells: Array<{ row: number; col: number }> = [{ row, col }];

      for (const [dr, dc] of dirs) {
        let r = row + dr;
        let c = col + dc;

        while (
          r >= 0 && r < CARO_BOARD_SIZE &&
          c >= 0 && c < CARO_BOARD_SIZE &&
          board[r * CARO_BOARD_SIZE + c] === pieceValue
        ) {
          cells.push({ row: r, col: c });
          r += dr;
          c += dc;
        }
      }

      if (cells.length >= CARO_WIN_LENGTH) {
        return cells;
      }
    }

    return null;
  }

  private checkCaroDraw(board: number[]): boolean {
    for (let i = 0; i < board.length; i++) {
      if (board[i] === 0) return false;
    }
    return true;
  }
}
