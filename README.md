# IpêXchange

Intent marketplace for Ipê City. Citizens list their **Interests** (what they
are looking for) and their **Offers** (goods, services, work, knowledge); the
platform crosses every intent in the network to suggest direct trades and
multi-hop trade cycles of 2 or 3 people that no pair could close alone.

Web app: [ipexchange.xyz](https://ipexchange.xyz) · Telegram Mini App: xchange.synapses.academy · Bot: [@ipexchange_bot](https://t.me/ipexchange_bot)

## Features

- **Market feed** with text and semantic search (pgvector embeddings)
- **Nexum**, the trade oracle: voice or chat interview that drafts your intents
- **Interest marks** with Telegram DM notifications to the intent owner
- **Multi-hop trade cycles**: automatic ring discovery after every publish,
  accept/decline, delivery confirmations, value-imbalance guard (max 25%)
- **Telegram account linking** via signed deep-link tokens

## Stack

- **Frontend:** React + Vite (`apps/web`), pure JavaScript
- **API:** Hono on Cloudflare Workers (`apps/api`), serving the SPA as static assets
- **Database:** Supabase (Postgres + pgvector + Storage), Worker-only access
- **Auth:** Privy (email, wallet, Telegram) on web; Telegram initData in the Mini App
- **AI:** Groq (Llama 3.3 interview + drafting, Whisper transcription) with
  Gemini fallback; `gemini-embedding-001` for embeddings
- **Bot:** Telegram Bot API via Worker webhook
- **Blockchain:** Base L2 (chainId 8453) — payments arrive in launch 2

## Development

```bash
npm install
npm run dev:api    # wrangler dev on :8787 (needs apps/api/.dev.vars)
npm run dev        # vite on :5173, proxies /api to :8787
```

Copy `apps/api/.dev.vars.example` to `apps/api/.dev.vars` and fill in the secrets.

## Database

```bash
DATABASE_URL=postgresql://... npm run db:apply   # apply supabase/migrations (tracked in schema_migrations)
npm run db:seed                                  # seed dev data + verify multi-hop matching
```

## Deploy

```bash
npm run deploy     # builds apps/web and deploys the Worker with assets
```

Secrets in production are set with `wrangler secret bulk` (see the list in
`apps/api/wrangler.jsonc`). After the first deploy, register the bot webhook:

```bash
curl "https://api.telegram.org/bot$TOKEN/setWebhook" \
  -d "url=https://ipexchange.xyz/api/telegram/webhook" \
  -d "secret_token=$TELEGRAM_WEBHOOK_SECRET"
```
