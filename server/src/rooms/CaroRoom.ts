import { Room, Client } from "@colyseus/core";
import { CaroState } from "../schemas/CaroState";
import { CaroPlayer } from "../schemas/CaroPlayer";

const BOARD_SIZE = 15;
const WIN_LENGTH = 5;
const TURN_TIMEOUT = 60000; // 60 seconds per turn

type CellValue = 0 | 1 | 2; // 0=empty, 1=X, 2=O

interface CaroChallenge {
  challengerId: string;
  challengerName: string;
  targetId: string;
  targetName: string;
  timestamp: number;
}

export class CaroRoom extends Room<CaroState> {
  maxClients = 2;
  playerOrder: string[] = [];

  // Map of active games by room ID
  private static activeGames: Map<string, CaroRoom> = new Map();

  onCreate(options: any) {
    this.setState(new CaroState());

    // Initialize empty board
    this.state.boardSize = BOARD_SIZE;
    this.state.board = new Array(BOARD_SIZE * BOARD_SIZE).fill(0);
    this.state.phase = "waiting";

    this.onMessage("caroMove", (client, data: { row: number; col: number }) => {
      this.handleMove(client.sessionId, data.row, data.col);
    });

    this.onMessage("caroLeave", (client) => {
      this.handleLeave(client.sessionId);
    });

    // Turn timer
    this.setSimulationInterval((delta) => this.update(delta), 1000);

    console.log("[CaroRoom] Created");
  }

  onJoin(client: Client, options: any) {
    if (this.state.players.size >= this.maxClients) {
      client.leave();
      return;
    }

    const player = new CaroPlayer();
    player.id = client.sessionId;
    player.name = options.name || `Player${this.state.players.size + 1}`;
    player.piece = this.state.players.size === 0 ? "X" : "O";

    this.state.players.set(client.sessionId, player);

    if (this.state.players.size === 1) {
      this.state.player1Id = client.sessionId;
    } else if (this.state.players.size === 2) {
      this.state.player2Id = client.sessionId;
    }

    console.log(`[CaroRoom] ${player.name} joined (${this.state.players.size}/2) - Piece: ${player.piece}`);

    // When both players joined, start the game
    if (this.state.players.size === 2) {
      this.startGame();
    }
  }

  onLeave(client: Client, consented: boolean) {
    const player = this.state.players.get(client.sessionId);
    if (player) {
      console.log(`[CaroRoom] ${player.name} left`);

      // Auto forfeit - other player wins
      if (this.state.phase === "playing") {
        this.state.players.forEach((p, sessionId) => {
          if (sessionId !== client.sessionId) {
            this.state.winner = sessionId;
            this.state.phase = "finished";

            this.broadcast("caroEnd", {
              winner: sessionId,
              winnerName: p.name,
              loserName: player.name,
              reason: "opponent_left"
            });
          }
        });
      }
    }

    this.state.players.delete(client.sessionId);
  }

  private startGame() {
    // Randomly decide who goes first
    const playerIds = Array.from(this.state.players.keys());
    this.playerOrder = playerIds.sort(() => Math.random() - 0.5);
    this.state.currentTurn = this.playerOrder[0];
    this.state.phase = "playing";

    // Player1 (X) or Player2 (O) based on playerOrder
    const firstPlayer = this.state.players.get(this.state.currentTurn);
    const firstPiece = firstPlayer?.piece || "X";
    const secondPiece = firstPiece === "X" ? "O" : "X";

    // Notify both players
    this.state.players.forEach((player, sessionId) => {
      const opponentId = this.playerOrder.find(id => id !== sessionId) || "";
      const opponent = this.state.players.get(opponentId);
      const myPiece = player.piece;
      const isMyTurn = sessionId === this.state.currentTurn;

      this.clients.find(c => c.sessionId === sessionId)?.send("caroStart", {
        opponentId,
        opponentName: opponent?.name || "Player",
        myPiece,
        isMyTurn
      });
    });

    console.log(`[CaroRoom] Game started! ${this.state.players.get(this.state.currentTurn)?.name} (${this.state.players.get(this.state.currentTurn)?.piece}) goes first`);
  }

  private handleMove(sessionId: string, row: number, col: number) {
    if (this.state.phase !== "playing") {
      console.log(`[CaroRoom] Move rejected: game not in playing phase`);
      return;
    }

    if (this.state.currentTurn !== sessionId) {
      const client = this.clients.find(c => c.sessionId === sessionId);
      if (client) {
        client.send("caroError", { message: "Not your turn" });
      }
      return;
    }

    // Validate bounds
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
      console.log(`[CaroRoom] Move rejected: out of bounds (${row}, ${col})`);
      return;
    }

    const idx = row * BOARD_SIZE + col;

    // Check if cell is empty
    if (this.state.board[idx] !== 0) {
      console.log(`[CaroRoom] Move rejected: cell occupied at (${row}, ${col})`);
      return;
    }

    const player = this.state.players.get(sessionId);
    if (!player) return;

    // Place the piece
    const pieceValue = player.piece === "X" ? 1 : 2;
    this.state.board[idx] = pieceValue;
    this.state.lastMoveRow = row;
    this.state.lastMoveCol = col;

    console.log(`[CaroRoom] ${player.name} (${player.piece}) played at (${row}, ${col})`);

    // Broadcast move to both players
    const isMyMove = true; // For the player who made the move
    this.broadcast("caroMove", {
      row,
      col,
      piece: player.piece,
      playerId: sessionId,
      playerName: player.name
    });

    // Check for win
    const winningCells = this.checkWin(row, col, pieceValue);
    if (winningCells) {
      this.state.phase = "finished";
      this.state.winner = sessionId;

      this.broadcast("caroEnd", {
        winner: sessionId,
        winnerName: player.name,
        winningCells,
        reason: "win"
      });

      console.log(`[CaroRoom] ${player.name} (${player.piece}) wins!`);
      return;
    }

    // Check for draw
    if (this.checkDraw()) {
      this.state.phase = "finished";
      this.state.winner = "";

      this.broadcast("caroEnd", {
        winner: null,
        winningCells: [],
        reason: "draw"
      });

      console.log(`[CaroRoom] Game ended in a draw`);
      return;
    }

    // Switch turn
    this.switchTurn();
  }

  private checkWin(row: number, col: number, pieceValue: number): Array<{ row: number; col: number }> | null {
    const directions = [
      [[0, 1], [0, -1]],   // horizontal
      [[1, 0], [-1, 0]], // vertical
      [[1, 1], [-1, -1]], // diagonal \
      [[1, -1], [-1, 1]]  // diagonal /
    ];

    for (const dirs of directions) {
      const cells: Array<{ row: number; col: number }> = [{ row, col }];

      // Check count in both directions
      for (const [dr, dc] of dirs) {
        let r = row + dr;
        let c = col + dc;

        while (
          r >= 0 && r < BOARD_SIZE &&
          c >= 0 && c < BOARD_SIZE &&
          this.state.board[r * BOARD_SIZE + c] === pieceValue
        ) {
          cells.push({ row: r, col: c });
          r += dr;
          c += dc;
        }
      }

      if (cells.length >= WIN_LENGTH) {
        return cells;
      }
    }

    return null;
  }

  private checkDraw(): boolean {
    for (let i = 0; i < this.state.board.length; i++) {
      if (this.state.board[i] === 0) return false;
    }
    return true;
  }

  private switchTurn() {
    const currentIdx = this.playerOrder.indexOf(this.state.currentTurn);
    const nextIdx = (currentIdx + 1) % this.playerOrder.length;
    this.state.currentTurn = this.playerOrder[nextIdx];

    const nextPlayer = this.state.players.get(this.state.currentTurn);
    console.log(`[CaroRoom] Turn: ${nextPlayer?.name} (${nextPlayer?.piece})`);

    this.broadcast("caroTurnChange", {
      turn: this.state.currentTurn,
      turnName: nextPlayer?.name || "Player"
    });
  }

  private handleLeave(sessionId: string) {
    const player = this.state.players.get(sessionId);
    if (!player) return;

    // Find opponent
    let opponentId = "";
    let opponent: CaroPlayer | undefined;

    this.state.players.forEach((p, id) => {
      if (id !== sessionId) {
        opponentId = id;
        opponent = p;
      }
    });

    if (opponentId && opponent && this.state.phase === "playing") {
      // Player leaves mid-game = forfeit
      this.state.phase = "finished";
      this.state.winner = opponentId;

      this.broadcast("caroEnd", {
        winner: opponentId,
        winnerName: opponent.name,
        loserName: player.name,
        reason: "opponent_left"
      });
    }

    // Client will be disconnected by room automatically
  }

  update(delta: number) {
    this.state.serverTime = Date.now();
  }

  onDispose() {
    console.log("[CaroRoom] Disposed");
  }
}