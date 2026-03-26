import { Room, Client } from "@colyseus/core";
import { CaroState } from "../schemas/CaroState";
export declare class CaroRoom extends Room<CaroState> {
    maxClients: number;
    playerOrder: string[];
    private static activeGames;
    onCreate(options: any): void;
    onJoin(client: Client, options: any): void;
    onLeave(client: Client, consented: boolean): void;
    private startGame;
    private handleMove;
    private checkWin;
    private checkDraw;
    private switchTurn;
    private handleLeave;
    update(delta: number): void;
    onDispose(): void;
}
//# sourceMappingURL=CaroRoom.d.ts.map