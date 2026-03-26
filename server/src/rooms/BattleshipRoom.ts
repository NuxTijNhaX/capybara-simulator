import { Room, Client } from "@colyseus/core";
import { BattleshipState } from "../schemas/BattleshipState";
import { BattleshipPlayer, Ship } from "../schemas/BattleshipPlayer";

const SHIP_TYPES = [
  { name: "Carrier", size: 5 },
  { name: "Battleship", size: 4 },
  { name: "Cruiser", size: 3 },
  { name: "Submarine", size: 3 },
  { name: "Destroyer", size: 2 }
];

const BOARD_SIZE = 10;
const TURN_TIMEOUT = 30000; // 30 seconds per turn

type ShotResult = "hit" | "miss" | "sunk" | "invalid" | "already";

export class BattleshipRoom extends Room<BattleshipState> {
  maxClients = 2;
  playerOrder: string[] = [];

  onCreate(options: any) {
    this.setState(new BattleshipState());

    this.onMessage("placeShips", (client, data: { ships: Array<{name: string, size: number, x: number, y: number, rotation: number}> }) => {
      this.handlePlaceShips(client.sessionId, data.ships);
    });

    this.onMessage("fire", (client, data: { x: number, y: number }) => {
      this.handleFire(client.sessionId, data.x, data.y);
    });

    this.onMessage("ready", (client) => {
      this.handleReady(client.sessionId);
    });

    // Turn timer
    this.setSimulationInterval((delta) => this.update(delta),1000);

    console.log("[BattleshipRoom] Created");
  }

  onJoin(client: Client, options: any) {
    if (this.state.players.size >= this.maxClients) {
      client.leave();
      return;
    }

    const player = new BattleshipPlayer();
    player.id = client.sessionId;
    player.name = options.name || `Player${this.state.players.size + 1}`;
    player.board = new Array(BOARD_SIZE * BOARD_SIZE).fill(0);

    this.state.players.set(client.sessionId, player);
    
    if (this.state.players.size === 1) {
      this.state.player1Id = client.sessionId;
    } else if (this.state.players.size === 2) {
      this.state.player2Id = client.sessionId;
    }

    console.log(`[BattleshipRoom] ${player.name} joined (${this.state.players.size}/2)`);

    // When both players joined, send game start
    if (this.state.players.size === 2) {
      this.broadcast("gameStart", {
        player1: this.state.player1Id,
        player2: this.state.player2Id
      });
    }
  }

  onLeave(client: Client, consented: boolean) {
    const player = this.state.players.get(client.sessionId);
    if (player) {
      console.log(`[BattleshipRoom] ${player.name} left`);

      // Auto forfeit - other player wins
      if (this.state.phase !== "finished") {
        this.state.players.forEach((p, sessionId) => {
          if (sessionId !== client.sessionId) {
            this.state.winner = sessionId;
            this.state.phase = "finished";
            this.broadcast("gameEnd", {
              winner: sessionId,
              winnerName: p.name,
              reason: "opponent_left"
            });
          }
        });
      }
    }

    this.state.players.delete(client.sessionId);
  }

  update(delta: number) {
    this.state.serverTime = Date.now();

    // Turn timeout check
    if (this.state.phase === "playing" && this.state.currentTurn && this.state.turnTimer > 0) {
      this.state.turnTimer -= delta / 1000;
      
      if (this.state.turnTimer <= 0) {
        // Time's up - skip turn
        this.switchTurn();
      }
    }
  }

  private handlePlaceShips(sessionId: string, ships: Array<{name: string, size: number, x: number, y: number, rotation: number}>) {
    const player = this.state.players.get(sessionId);
    if (!player || this.state.phase !== "placement") return;

    // Validate ship count
    if (ships.length !== 5) {
      const client = this.clients.find(c => c.sessionId === sessionId);
      if (client) client.send("error", { message: "Must place exactly 5 ships" });
      return;
    }

    // Reset board
    player.board = new Array(BOARD_SIZE * BOARD_SIZE).fill(0);
    player.ships = [];

    // Place each ship
    for (const shipData of ships) {
      const ship = new Ship();
      ship.name = shipData.name;
      ship.size = shipData.size;
      ship.x = shipData.x;
      ship.y = shipData.y;
      ship.rotation = shipData.rotation;

      if (!this.canPlaceShip(player.board, ship)) {
        const client = this.clients.find(c => c.sessionId === sessionId);
        if (client) client.send("error", { message: `Cannot place ${ship.name}` });
        return;
      }

      // Mark ship positions on board
      this.placeShipOnBoard(player.board, ship);
      player.ships.push(ship);
    }

    player.placed = true;
    console.log(`[BattleshipRoom] ${player.name} placed ships`);

    // Check if both players ready
    this.checkBothReady();
  }

  private canPlaceShip(board: number[], ship: Ship): boolean {
    const positions = this.getShipPositions(ship);

    for (const pos of positions) {
      if (pos.x < 0 || pos.x >= BOARD_SIZE || pos.y < 0 || pos.y >= BOARD_SIZE) {
        return false;
      }
      if (board[pos.y * BOARD_SIZE + pos.x] !== 0) {
        return false;
      }
    }
    return true;
  }

  private getShipPositions(ship: Ship): Array<{x: number, y: number}> {
    const positions: Array<{x: number, y: number}> = [];
    for (let i = 0; i < ship.size; i++) {
      if (ship.rotation === 0) {
        positions.push({ x: ship.x + i, y: ship.y });
      } else {
        positions.push({ x: ship.x, y: ship.y + i });
      }
    }
    return positions;
  }

  private placeShipOnBoard(board: number[], ship: Ship) {
    const positions = this.getShipPositions(ship);
    for (const pos of positions) {
      board[pos.y * BOARD_SIZE + pos.x] = 1; // 1 = ship
    }
  }

  private handleReady(sessionId: string) {
    const player = this.state.players.get(sessionId);
    if (!player || !player.placed || player.ready) return;

    player.ready = true;
    console.log(`[BattleshipRoom] ${player.name} is ready`);

    this.checkBothReady();
  }

  private checkBothReady() {
    let allReady = true;
    let allPlaced = true;

    this.state.players.forEach((player) => {
      if (!player.placed) allPlaced = false;
      if (!player.ready) allReady = false;
    });

    if (allPlaced && allReady && this.state.players.size === 2) {
      // Both have placed ships, transition to playing
      this.state.phase = "playing";
      
      // Randomly choose who goes first
      const playerIds = Array.from(this.state.players.keys());
      this.playerOrder = playerIds.sort(() => Math.random() - 0.5);
      this.state.currentTurn = this.playerOrder[0];
      this.state.turnTimer = TURN_TIMEOUT / 1000;

      this.broadcast("phaseChange", {
        phase: "playing",
        firstTurn: this.state.currentTurn
      });

      console.log(`[BattleshipRoom] Game started! ${this.state.players.get(this.state.currentTurn)?.name} goes first`);
    }
  }

  private handleFire(sessionId: string, x: number, y: number) {
    if (this.state.phase !== "playing") return;
    if (this.state.currentTurn !== sessionId) {
      const client = this.clients.find(c => c.sessionId === sessionId);
      if (client) client.send("error", { message: "Not your turn" });
      return;
    }

    // Find opponent
    let opponentId = "";
    this.state.players.forEach((_, id) => {
      if (id !== sessionId) opponentId = id;
    });

    if (!opponentId) return;

    const opponent = this.state.players.get(opponentId);
    const shooter = this.state.players.get(sessionId);
    if (!opponent || !shooter) return;

    const idx = y * BOARD_SIZE + x;
    
    // Check bounds
    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) {
      const client = this.clients.find(c => c.sessionId === sessionId);
      if (client) client.send("error", { message: "Out of bounds" });
      return;
    }

    // Check if already fired here
    if (opponent.board[idx] === 2 || opponent.board[idx] === 3) {
      const client = this.clients.find(c => c.sessionId === sessionId);
      if (client) client.send("error", { message: "Already fired here" });
      return;
    }

    // Process shot
    let result: ShotResult;
    if (opponent.board[idx] === 1) {
      // Hit!
      opponent.board[idx] = 2; // 2 = hit
      shooter.hits++;
      result = "hit";

      // Check if ship sunk
      const sunkShip = this.checkShipSunk(opponent, x, y);
      if (sunkShip) {
        result = "sunk";
        sunkShip.sunk = true;

        // Check win condition
        if (this.checkAllShipsSunk(opponent)) {
          this.state.phase = "finished";
          this.state.winner = sessionId;
          
          this.broadcast("gameEnd", {
            winner: sessionId,
            winnerName: shooter.name,
            loserName: opponent.name,
            reason: "all_sunk"
          });

          console.log(`[BattleshipRoom] ${shooter.name} wins!`);
          return;
        }
      }
    } else {
      // Miss
      opponent.board[idx] = 3; // 3 = miss
      shooter.misses++;
      result = "miss";
    }

    // Broadcast shot result
    this.broadcast("shotResult", {
      shooter: sessionId,
      shooterName: shooter.name,
      x,
      y,
      result,
      targetId: opponentId
    });

    // Switch turn only on miss (hit = continue shooting)
    if (result === "miss") {
      this.switchTurn();
    } else {
      // Reset turn timer for continued turn
      this.state.turnTimer = TURN_TIMEOUT /1000;
    }
  }

  private checkShipSunk(player: BattleshipPlayer, hitX: number, hitY: number): Ship | null {
    for (const ship of player.ships) {
      if (ship.sunk) continue;

      const positions = this.getShipPositions(ship);
      let allHit = true;
      
      for (const pos of positions) {
        const idx = pos.y * BOARD_SIZE + pos.x;
        if (player.board[idx] !== 2) {
          allHit = false;
          break;
        }
      }

      if (allHit) {
        return ship;
      }
    }
    return null;
  }

  private checkAllShipsSunk(player: BattleshipPlayer): boolean {
    for (const ship of player.ships) {
      if (!ship.sunk) return false;
    }
    return true;
  }

  private switchTurn() {
    const currentIdx = this.playerOrder.indexOf(this.state.currentTurn);
    const nextIdx = (currentIdx +1) % this.playerOrder.length;
    this.state.currentTurn = this.playerOrder[nextIdx];
    this.state.turnTimer = TURN_TIMEOUT / 1000;

    this.broadcast("turnChange", {
      turn: this.state.currentTurn,
      turnName: this.state.players.get(this.state.currentTurn)?.name
    });
  }

  onDispose() {
    console.log("[BattleshipRoom] Disposed");
  }
}