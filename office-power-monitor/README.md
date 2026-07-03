# Office Power Monitor

Real-time office electricity monitoring — **simulator + backend + dashboard +
Discord bot**, all sharing one source of truth.

The office has **3 rooms** (Drawing Room, Work Room 1, Work Room 2), each with
**2 fans (60W)** and **3 lights (15W)** — 15 devices total. A simulator flips
devices every 5 seconds using realistic biases based on office hours, and
everything downstream (alerts, incidents, dashboard, Discord bot) reacts in real
time.

## Screenshots

- Dark glassmorphic dashboard with summary cards, animated room cards, live
  power breakdown, and an incident/alert panel.
- Top-down office layout SVG with **spinning fans** and **glowing lights** wired
  directly to live device state.

## Repository layout

```
office-power-monitor/
├── backend/         Node.js + Express + Socket.IO (single source of truth)
├── frontend/        React + Vite + Tailwind + Framer Motion dashboard
├── bot/             discord.js bot (+ optional OpenAI polishing)
├── docs/            HARDWARE.md · ARCHITECTURE.md · API.md
└── README.md
```

## Quick start

Requires Node.js **18+**.

### 1. Backend

```bash
cd backend
cp .env.example .env      # optional; defaults work out of the box
npm install
npm start                 # http://localhost:4000
```

Exposes REST at `/api/*` and Socket.IO on the same port. The simulator starts
automatically.

### 2. Frontend

```bash
cd frontend
cp .env.example .env      # set VITE_BACKEND_URL if backend not on localhost:4000
npm install
npm run dev               # http://localhost:5173
```

The dashboard connects via Socket.IO and updates continuously — **no refresh
required**.

### 3. Discord bot (optional)

```bash
cd bot
cp .env.example .env
# Fill in DISCORD_TOKEN (required) and ALERT_CHANNEL_IDS + OPENAI_API_KEY (both optional)
npm install
npm start
```

Commands:

| Command              | Description                   |
| -------------------- | ----------------------------- |
| `!status`            | Overall office snapshot       |
| `!room <id-or-name>` | Detailed room view            |
| `!usage`             | Instantaneous W + today's kWh |
| `!help`              | List all commands             |

With `ALERT_CHANNEL_IDS` set, newly opened backend alerts are relayed to those
Discord channels in real time.

If `OPENAI_API_KEY` is set, responses are polished by the configured model
(`OPENAI_MODEL`, default `gpt-4o-mini`). **On any LLM failure the bot silently
falls back to the deterministic template output** — every command is guaranteed
to reply.

## What the system does

- **Simulator** ticks every 5s, respects a 60s minimum dwell time, biases
  devices ON during 9AM–5PM and OFF outside those hours.
- **Alert engine** raises three kinds of alerts:
  1. `device_on_after_hours` — any ON device outside office hours (medium)
  2. `room_on_after_hours` — every device in a room ON outside hours (high)
  3. `room_on_too_long` — entire room ON continuously for >2h (high)
- **Incident aggregator** groups active alerts by room into one open incident
  per room; auto-resolves when the room clears.
- **Broadcaster** pushes `devices:update`, `rooms:update`, `usage:update`,
  `alerts:update`, `incidents:update` over Socket.IO. Every new client receives
  a full snapshot on connect.
- **REST API** exposes the same data via `/api/devices`, `/api/rooms`,
  `/api/usage`, `/api/alerts`, `/api/incidents`.

Full endpoint reference: [docs/API.md](docs/API.md). System architecture & event
bus: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Real-hardware deployment
guide: [docs/HARDWARE.md](docs/HARDWARE.md).

## Tech stack

| Layer     | Tech                                                               |
| --------- | ------------------------------------------------------------------ |
| Backend   | Node.js, Express, Socket.IO                                        |
| Simulator | Plain JS (dependency-injectable clock/RNG)                         |
| Frontend  | React 18, Vite 5, Tailwind CSS 3, Framer Motion 11                 |
| Discord   | discord.js v14, socket.io-client, optional OpenAI Chat Completions |
| Storage   | In-memory (single-process, spec-compliant)                         |
| Language  | JavaScript                                                         |

## Configuration

Every service is env-driven. See:

- [backend/.env.example](backend/.env.example) — port, CORS origin, simulator
  cadence, min dwell, office hours, "room on too long" threshold
- [frontend/.env.example](frontend/.env.example) — `VITE_BACKEND_URL`
- [bot/.env.example](bot/.env.example) — Discord token, backend URLs, alert
  channels, OpenAI key/model

## Design principles

- **Single source of truth.** All derived views (rooms, usage, alerts,
  incidents) recompute from the same `DeviceStore`.
- **Clean architecture / feature folders.** Every backend module lives under
  `backend/src/{store,simulator,services,alerts,incidents,routes,sockets}` with
  a barrel export and clear dependencies.
- **Dependency injection everywhere.** No hidden globals inside features —
  engines, routers, and the broadcaster take their collaborators through
  constructors.
- **Event-driven.** Stores emit; engines and the broadcaster subscribe. Swapping
  the simulator for an MQTT bridge to real hardware requires zero changes
  downstream (see [docs/HARDWARE.md](docs/HARDWARE.md)).
- **JSDoc types** on every public class and function.
- **Graceful shutdown** across all three services.

## License

MIT.
