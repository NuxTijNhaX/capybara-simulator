import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { createServer } from "http";
import { VibeRoom } from "./rooms/VibeRoom";
import { BattleshipRoom } from "./rooms/BattleshipRoom";
import { CaroRoom } from "./rooms/CaroRoom";

const PORT = Number(process.env.PORT) || 2567;

// Create HTTP server with custom request handler
const httpServer = createServer((req, res) => {
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
const gameServer = new Server({
  transport: new WebSocketTransport({
    server: httpServer,
    pingInterval: 5000,
    pingMaxRetries: 3,
  }),
});

// Define room
console.log("[Server] Registering rooms...");
gameServer.define("vibe_room", VibeRoom);
gameServer.define("battleship_room", BattleshipRoom);
gameServer.define("caro_room", CaroRoom);

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
