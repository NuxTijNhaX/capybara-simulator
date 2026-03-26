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
exports.VibeState = void 0;
const schema_1 = require("@colyseus/schema");
const Player_1 = require("./Player");
class VibeState extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.players = new schema_1.MapSchema();
        this.serverTime = Date.now();
        this.playerCount = 0;
    }
}
exports.VibeState = VibeState;
__decorate([
    (0, schema_1.type)({ map: Player_1.Player }),
    __metadata("design:type", Object)
], VibeState.prototype, "players", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], VibeState.prototype, "serverTime", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], VibeState.prototype, "playerCount", void 0);
//# sourceMappingURL=VibeState.js.map