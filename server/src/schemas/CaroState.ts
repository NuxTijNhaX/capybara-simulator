import { Schema, type, MapSchema } from "@colyseus/schema";
import { CaroPlayer } from "./CaroPlayer";

export class CaroState extends Schema {
  @type({ map: CaroPlayer })
  players: MapSchema<CaroPlayer> = new MapSchema<CaroPlayer>();

  @type("string")
  player1Id: string = "";

  @type("string")
  player2Id: string = "";

  @type("string")
  currentTurn: string = ""; // sessionId of current player

  @type("string")
  phase: string = "waiting"; // "waiting" | "playing" | "finished"

  @type("string")
  winner: string = "";

  @type("number")
  serverTime: number = Date.now();

  @type(["number"])
  board: number[] = []; // 15x15 board, 0=empty, 1=X, 2=O

  @type("number")
  boardSize: number = 15;

  @type("number")
  lastMoveRow: number = -1;

  @type("number")
  lastMoveCol: number = -1;
}