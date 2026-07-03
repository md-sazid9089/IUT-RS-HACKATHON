# office-power-monitor

Real-time office electricity monitoring system (simulator + backend + dashboard + Discord bot).

## Structure

```
office-power-monitor/
  backend/    Node.js + Express + Socket.IO (single source of truth)
  frontend/   React + Vite + Tailwind + Framer Motion dashboard
  bot/        discord.js bot
  docs/       Hardware & architecture documentation
```

Full documentation lives in `docs/` and is generated in later modules.
