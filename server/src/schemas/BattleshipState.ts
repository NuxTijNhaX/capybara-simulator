import { Schema, type, MapSchema } from "@colyseus/schema";
import { BattleshipPlayer } from "./BattleshipPlayer";

export class BattleshipState extends Schema {
  @type({ map: BattleshipPlayer })
  players = new MapSchema<BattleshipPlayer>();

  @type("string")
  phase: string = "placement"; // 'placement' | 'playing' | 'finished'

  @type("string")
  currentTurn: string = ""; // sessionId of player whose turn it is

  @type("string")
  winner: string = ""; // sessionId of winner (empty until game ends)

  @type("number")
  turnTimer: number = 0; // Countdown timer for current turn

  @type("string")
  player1Id: string = "";

  @type("string")
  player2Id: string = "";

  @type("number")
  serverTime: number = Date.now();
}