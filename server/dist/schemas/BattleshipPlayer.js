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
exports.BattleshipPlayer = exports.Ship = void 0;
const schema_1 = require("@colyseus/schema");
class Ship extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.name = "";
        this.size = 0;
        this.x = 0;
        this.y = 0;
        this.rotation = 0; // 0 = horizontal, 1 = vertical
        this.sunk = false;
    }
}
exports.Ship = Ship;
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], Ship.prototype, "name", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], Ship.prototype, "size", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], Ship.prototype, "x", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], Ship.prototype, "y", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], Ship.prototype, "rotation", void 0);
__decorate([
    (0, schema_1.type)("boolean"),
    __metadata("design:type", Boolean)
], Ship.prototype, "sunk", void 0);
class BattleshipPlayer extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.id = "";
        this.name = "";
        this.board = []; // Flat array: 10x10 = 100 cells (0=empty,1=ship, 2=hit, 3=miss)
        this.ready = false;
        this.placed = false;
        this.ships = [];
        this.hits = 0;
        this.misses = 0;
        this.lastActivity = Date.now();
    }
}
exports.BattleshipPlayer = BattleshipPlayer;
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], BattleshipPlayer.prototype, "id", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], BattleshipPlayer.prototype, "name", void 0);
__decorate([
    (0, schema_1.type)({ array: "number" }),
    __metadata("design:type", Array)
], BattleshipPlayer.prototype, "board", void 0);
__decorate([
    (0, schema_1.type)("boolean"),
    __metadata("design:type", Boolean)
], BattleshipPlayer.prototype, "ready", void 0);
__decorate([
    (0, schema_1.type)("boolean"),
    __metadata("design:type", Boolean)
], BattleshipPlayer.prototype, "placed", void 0);
__decorate([
    (0, schema_1.type)({ array: Ship }),
    __metadata("design:type", Array)
], BattleshipPlayer.prototype, "ships", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], BattleshipPlayer.prototype, "hits", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], BattleshipPlayer.prototype, "misses", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], BattleshipPlayer.prototype, "lastActivity", void 0);
//# sourceMappingURL=BattleshipPlayer.js.map