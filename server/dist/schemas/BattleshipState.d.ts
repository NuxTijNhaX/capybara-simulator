import { Schema, MapSchema } from "@colyseus/schema";
import { BattleshipPlayer } from "./BattleshipPlayer";
export declare class BattleshipState extends Schema {
    players: MapSchema<BattleshipPlayer, string>;
    phase: string;
    currentTurn: string;
    winner: string;
    turnTimer: number;
    player1Id: string;
    player2Id: string;
    serverTime: number;
}
//# sourceMappingURL=BattleshipState.d.ts.map