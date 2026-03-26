import { Schema, type } from "@colyseus/schema";

export class Player extends Schema {
  @type("string")
  id: string;

  @type("string")
  name: string;

  @type("number")
  x: number = 0;

  @type("number")
  y: number = 0;

  @type("number")
  z: number = 0;

  @type("number")
  rotationY: number = 0;

  @type("string")
  animation: string = "idle"; // 'idle', 'walk', 'sit'

  @type("string")
  outfit: string = "{}"; // JSON string of equipped items

  @type("number")
  lastActivity: number = Date.now();

  @type("number")
  joinTime: number = Date.now();

  @type("string")
  ridingOn: string = ""; // sessionId of host player (empty = not riding)

  @type("string")
  carrying: string = ""; // sessionId of rider (empty = not carrying anyone)
}
