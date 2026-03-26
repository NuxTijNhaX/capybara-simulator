import { Room, Client } from "@colyseus/core";
import { VibeState } from "../schemas/VibeState";
export declare class VibeRoom extends Room<VibeState> {
    maxClients: number;
    readonly AFK_TIMEOUT: number;
    readonly TICK_RATE = 50;
    private challenges;
    private caroChallenges;
    private caroGames;
    private caroPlayerGames;
    onCreate(options: any): void;
    onJoin(client: Client, options: any): void;
    onLeave(client: Client, consented: boolean): void;
    onDispose(): void;
    update(deltaTime: number): void;
    private cleanupInactivePlayers;
    private cleanupExpiredChallenges;
    private generateRandomOutfit;
    private generateRandomName;
    private checkCaroWin;
    private checkCaroDraw;
}
//# sourceMappingURL=VibeRoom.d.ts.map