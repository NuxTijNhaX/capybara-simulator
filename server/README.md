# Capybara Vibe World - Server

Multiplayer server for Capybara Vibe World built with Colyseus.

## Features

- 50 players max per room
- Anonymous authentication (random names & outfits)
- Real-time position synchronization
- Chat messaging
- Emote system
- AFK detection (5 minute timeout)
- 20fps update rate

## Development

```bash
npm install
npm run dev
```

Server runs on `ws://localhost:2567`

## Production

```bash
npm run build
npm start
```

## Deployment (Railway)

1. Push code to GitHub
2. Connect Railway to repo
3. Deploy automatically via Dockerfile

Health check: `GET /health`

## Environment Variables

- `PORT` - Server port (default: 2567)
