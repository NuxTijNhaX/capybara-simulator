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
exports.BattleshipState = void 0;
const schema_1 = require("@colyseus/schema");
const BattleshipPlayer_1 = require("./BattleshipPlayer");
class BattleshipState extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.players = new schema_1.MapSchema();
        this.phase = "placement"; // 'placement' | 'playing' | 'finished'
        this.currentTurn = ""; // sessionId of player whose turn it is
        this.winner = ""; // sessionId of winner (empty until game ends)
        this.turnTimer = 0; // Countdown timer for current turn
        this.player1Id = "";
        this.player2Id = "";
        this.serverTime = Date.now();
    }
}
exports.BattleshipState = BattleshipState;
__decorate([
    (0, schema_1.type)({ map: BattleshipPlayer_1.BattleshipPlayer }),
    __metadata("design:type", Object)
], BattleshipState.prototype, "players", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], BattleshipState.prototype, "phase", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], BattleshipState.prototype, "currentTurn", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], BattleshipState.prototype, "winner", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], BattleshipState.prototype, "turnTimer", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], BattleshipState.prototype, "player1Id", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], BattleshipState.prototype, "player2Id", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], BattleshipState.prototype, "serverTime", void 0);
//# sourceMappingURL=BattleshipState.js.map