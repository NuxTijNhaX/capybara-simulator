import { Schema, type } from "@colyseus/schema";

export class CaroPlayer extends Schema {
  @type("string")
  id: string;

  @type("string")
  name: string;

  @type("string")
  piece: string = "X"; // "X" or "O"

  @type("number")
  wins: number = 0;

  @type("boolean")
  ready: boolean = false;
}