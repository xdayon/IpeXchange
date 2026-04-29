# IpêXchange — Claude Code Instructions

## Language Rule
**All user-facing text in the codebase must be in English.** This includes: UI labels, button text, placeholder text, toast messages, error messages, comments in JSX/HTML, and AI prompt outputs rendered to the screen. The developer (xdayon) communicates in Portuguese — that's fine — but every output targeting the site/app must be written in English.

## Project Overview
IpêXchange is the trade marketplace for Ipê City, a pop-up innovation city. It enables barter/exchange of goods and services among city residents using a voice-first, AI-native interface.

Demo deadline: **2026-05-01 (Thursday)**. Prioritize visible UX wins and real data flow over refactors.

## Tech Stack
- **Frontend:** React + Vite → deployed on Render (`ipexchange-front.onrender.com`)
- **Backend:** Express + Google Gemini Flash (`gemini-flash-latest`) → deployed on Render
- **Database:** Supabase (Postgres + pgvector, 768-dim embeddings) — schema at `backend/supabase_schema.sql`
- **Auth:** Privy (wallet + email), branded as "Ipê Passport"
- **AI:** Gemini Flash for chat, intent extraction, listing extraction, and embeddings

## Architecture Notes
- Session ID stored in localStorage as `'ipeCoreSessionId'`
- `CircularTradePage` uses hardcoded `'test-session-id'` — intentional for demo; the SQL function `find_trade_cycles()` guarantees a cycle for that ID
- DB categories: `Products | Services | Knowledge | Donations`
- Listings are created asynchronously via chat when `LISTING_READY: true` is detected in the Gemini response

## Code Conventions
- No comments unless the WHY is non-obvious
- No TypeScript — this is a JS project, keep it that way
- Don't add error handling for scenarios that can't happen
- Don't introduce abstractions beyond what the task requires
- Prefer editing existing files over creating new ones
- Keep components in `src/components/`, API calls in `src/lib/api.js`, backend routes in `backend/server.js`

## What NOT to Do
- Don't change `'Ipê City'` to `'Jurerê'` or `'Florianópolis'` — the Gemini system prompt had a bug with this, it was fixed
- Don't mock or stub DB/API calls — we use real Supabase data
- Don't create new debug files (there are already `debug.js`, `dev_debug.js`, `dev_debug_2.js` in root — ignore these)
- Don't add features beyond what was requested
- Don't generate documentation files unless explicitly asked
