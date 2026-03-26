"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaroState = void 0;
const schema_1 = require("@colyseus/schema");
const CaroPlayer_1 = require("./CaroPlayer");
class CaroState extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.players = new schema_1.MapSchema();
        this.player1Id = "";
        this.player2Id = "";
        this.currentTurn = ""; // sessionId of current player
        this.phase = "waiting"; // "waiting" | "playing" | "finished"
        this.winner = "";
        this.serverTime = Date.now();
        this.board = []; // 15x15 board, 0=empty, 1=X, 2=O
        this.boardSize = 15;
        this.lastMoveRow = -1;
        this.lastMoveCol = -1;
    }
}
exports.CaroState = CaroState;
__decorate([
    (0, schema_1.type)({ map: CaroPlayer_1.CaroPlayer }),
    __metadata("design:type", schema_1.MapSchema)
], CaroState.prototype, "players", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], CaroState.prototype, "player1Id", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], CaroState.prototype, "player2Id", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], CaroState.prototype, "currentTurn", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], CaroState.prototype, "phase", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], CaroState.prototype, "winner", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], CaroState.prototype, "serverTime", void 0);
__decorate([
    (0, schema_1.type)(["number"]),
    __metadata("design:type", Array)
], CaroState.prototype, "board", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], CaroState.prototype, "boardSize", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], CaroState.prototype, "lastMoveRow", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], CaroState.prototype, "lastMoveCol", void 0);
//# sourceMappingURL=CaroState.js.map