"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@colyseus/core");
const ws_transport_1 = require("@colyseus/ws-transport");
const http_1 = require("http");
const VibeRoom_1 = require("./rooms/VibeRoom");
const BattleshipRoom_1 = require("./rooms/BattleshipRoom");
const CaroRoom_1 = require("./rooms/CaroRoom");
const PORT = Number(process.env.PORT) || 2567;
// Create HTTP server with custom request handler
const httpServer = (0, http_1.createServer)((req, res) => {
    // Handle health check before WebSocket
    if (req.url === "/health" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            status: "ok",
            timestamp: Date.now(),
            uptime: process.uptime()
        }));
        return;
    }
    // Default response
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Capybara Vibe World Server");
});
// Create Colyseus server with WebSocket transport
const gameServer = new core_1.Server({
    transport: new ws_transport_1.WebSocketTransport({
        server: httpServer,
        pingInterval: 5000,
        pingMaxRetries: 3,
    }),
});
// Define room
console.log("[Server] Registering rooms...");
gameServer.define("vibe_room", VibeRoom_1.VibeRoom);
gameServer.define("battleship_room", BattleshipRoom_1.BattleshipRoom);
gameServer.define("caro_room", CaroRoom_1.CaroRoom);
// Start server
httpServer.listen(PORT, () => {
    console.log(`[Server] Capybara Vibe World Server running on port ${PORT}`);
    console.log(`[Server] WebSocket endpoint: ws://localhost:${PORT}`);
    console.log(`[Server] Health check: http://localhost:${PORT}/health`);
});
// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("[Server] SIGTERM received, shutting down gracefully...");
    gameServer.gracefullyShutdown().then(() => {
        httpServer.close();
        process.exit(0);
    });
});
process.on("SIGINT", () => {
    console.log("[Server] SIGINT received, shutting down gracefully...");
    gameServer.gracefullyShutdown().then(() => {
        httpServer.close();
        process.exit(0);
    });
});
//# sourceMappingURL=index.js.map