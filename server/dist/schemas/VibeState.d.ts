import { Schema, MapSchema } from "@colyseus/schema";
import { Player } from "./Player";
export declare class VibeState extends Schema {
    players: MapSchema<Player, string>;
    serverTime: number;
    playerCount: number;
}
//# sourceMappingURL=VibeState.d.ts.map