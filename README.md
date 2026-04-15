# Java Detection Systems — Discord Bot

A powerful Discord moderation and cheat scanner bot built with discord.js and OpenAI.

## Features

- **Full Moderation** — ban, kick, mute, warn, clear, slowmode, lock/unlock
- **Staff System** — `/staff` assigns role and sends welcome DM
- **Ticket System** — private support channels with close button
- **Cheat Scanner** — `/scan`, `/cheater`, `/cheaterlog`, `/checkinvite`
- **Surveillance** — `/track`, `/expose`, `/watchlist`, `/evidence`, `/profile`, `/intercept`, `/database`, `/verdict`, `/freeze`, `/classify`
- **Breach Alert** — `/breach` sends a realistic Java detection DM with fake token
- **AI Chat** — Bilingual (EN/DE), pings admins when needed, steps back when admin responds
- **Easter Egg** — Responds to "aydo" with "daddy 😏"

## Setup

```
npm install
```

### Required environment variables

| Variable | Description |
|---|---|
| `DISCORD_BOT_TOKEN` | Your Discord bot token |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | OpenAI base URL |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI API key |

## Run

```
npx tsx src/index.ts
```
