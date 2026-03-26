import { Room, Client } from "@colyseus/core";
import { BattleshipState } from "../schemas/BattleshipState";
export declare class BattleshipRoom extends Room<BattleshipState> {
    maxClients: number;
    playerOrder: string[];
    onCreate(options: any): void;
    onJoin(client: Client, options: any): void;
    onLeave(client: Client, consented: boolean): void;
    update(delta: number): void;
    private handlePlaceShips;
    private canPlaceShip;
    private getShipPositions;
    private placeShipOnBoard;
    private handleReady;
    private checkBothReady;
    private handleFire;
    private checkShipSunk;
    private checkAllShipsSunk;
    private switchTurn;
    onDispose(): void;
}
//# sourceMappingURL=BattleshipRoom.d.ts.map