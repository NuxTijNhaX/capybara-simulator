import { Schema, type } from "@colyseus/schema";

export class Ship extends Schema {
  @type("string")
  name: string = "";

  @type("number")
  size: number = 0;

  @type("number")
  x: number = 0;

  @type("number")
  y: number = 0;

  @type("number")
  rotation: number = 0; // 0 = horizontal, 1 = vertical

  @type("boolean")
  sunk: boolean = false;
}

export class BattleshipPlayer extends Schema {
  @type("string")
  id: string = "";

  @type("string")
  name: string = "";

  @type({ array: "number" })
  board: number[] = []; // Flat array: 10x10 = 100 cells (0=empty,1=ship, 2=hit, 3=miss)

  @type("boolean")
  ready: boolean = false;

  @type("boolean")
  placed: boolean = false;

  @type({ array: Ship })
  ships: Ship[] = [];

  @type("number")
  hits: number = 0;

  @type("number")
  misses: number = 0;

  @type("number")
  lastActivity: number = Date.now();
}