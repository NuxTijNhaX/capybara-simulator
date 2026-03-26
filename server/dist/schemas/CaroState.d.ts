import { Schema, MapSchema } from "@colyseus/schema";
import { CaroPlayer } from "./CaroPlayer";
export declare class CaroState extends Schema {
    players: MapSchema<CaroPlayer>;
    player1Id: string;
    player2Id: string;
    currentTurn: string;
    phase: string;
    winner: string;
    serverTime: number;
    board: number[];
    boardSize: number;
    lastMoveRow: number;
    lastMoveCol: number;
}
//# sourceMappingURL=CaroState.d.ts.map