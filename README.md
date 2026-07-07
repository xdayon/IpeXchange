# IpêXchange

Intent marketplace for Ipê City. Citizens list what they want, what they have
and what they can do; the platform crosses those intents to suggest purchases,
connections and multi-hop trade cycles.

Web app: [ipexchange.xyz](https://ipexchange.xyz) · Telegram Mini App: xchange.synapses.academy

## Stack

- **Frontend:** React + Vite (`apps/web`)
- **API:** Hono on Cloudflare Workers (`apps/api`), serving the SPA as static assets
- **Database:** Supabase (Postgres + pgvector + Storage)
- **Auth:** Privy (email, wallet, Telegram)
- **Blockchain:** Base L2 (chainId 8453)
- **AI:** Gemini (intent structuring + embeddings for semantic matching)
- **Bot:** Telegram Bot API via Worker webhook

## Development

```bash
npm install
npm run dev:api    # wrangler dev on :8787 (needs apps/api/.dev.vars)
npm run dev        # vite on :5173, proxies /api to :8787
```

Copy `apps/api/.dev.vars.example` to `apps/api/.dev.vars` and fill in the secrets.

## Database

```bash
DATABASE_URL=postgresql://... npm run db:apply   # apply supabase/migrations
npm run db:seed                                  # seed dev data + verify multi-hop matching
```

## Deploy

```bash
npm run deploy     # builds apps/web and deploys the Worker with assets
```

Secrets in production are set with `wrangler secret put` (see `apps/api/wrangler.jsonc`).
