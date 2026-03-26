import { Schema, type, MapSchema } from "@colyseus/schema";
import { Player } from "./Player";

export class VibeState extends Schema {
  @type({ map: Player })
  players = new MapSchema<Player>();

  @type("number")
  serverTime: number = Date.now();

  @type("number")
  playerCount: number = 0;
}
