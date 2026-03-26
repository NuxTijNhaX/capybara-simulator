import { Schema } from "@colyseus/schema";
export declare class Ship extends Schema {
    name: string;
    size: number;
    x: number;
    y: number;
    rotation: number;
    sunk: boolean;
}
export declare class BattleshipPlayer extends Schema {
    id: string;
    name: string;
    board: number[];
    ready: boolean;
    placed: boolean;
    ships: Ship[];
    hits: number;
    misses: number;
    lastActivity: number;
}
//# sourceMappingURL=BattleshipPlayer.d.ts.map