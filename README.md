# IpêXchange 🌳⚡

**An intelligent market for an intelligent city.**

IpêXchange is an integrated, real-time platform for trade, coordination, and circular economy. It transforms a local neighborhood into an active, AI-assisted economic network where everything is tradeable: from real estate and vehicles to artisan food, professional services, holistic therapies, and knowledge. 

Whether you're renting a beachfront studio, trading a surfboard for web design, or buying local sourdough with crypto, IpêXchange unifies the entire city's value into a single, fluid interface.

The first deployment targets **Ipê City** in Jurerê, Florianópolis, Brazil.

---

## 🎯 What Problem Does It Solve?

Modern communities are full of economic potential that remains locked. People have skills, goods, and resources they want to exchange, but lack the infrastructure to connect intelligently. Traditional marketplaces are passive, money-only listing boards that exclude those who have value to offer but lack immediate liquidity. Furthermore, no one has a real-time view of how a city's economy actually flows.

**IpêXchange solves the coordination problem.** It replaces passive boards with an active, AI-driven trade network. It provides a community with its own economic intelligence layer, making hidden value visible and tradable.

---

## ✨ Key Innovations

### 1. Multi-Hop Trade Intelligence 🔄
IpêXchange goes beyond simple buyer-seller pairs. Its AI engine computes circular trade cycles across 3 to 5 participants simultaneously. It matches people who cannot trade directly but can complete a loop together (e.g., A needs B, B needs C, C needs A). The system automatically finds these paths, utilizing a 30% value-balance threshold to ensure fair trades.

### 2. The Core: An AI Embedded in the City 🧠
Every resident has access to **The Core**: a conversational, multimodal AI (powered by Google Gemini) that intimately understands the local economy. You can speak to it via voice or text in any language. Ask what's available, describe what you need, and The Core actively assists in discovery, match-making, and trade negotiation. It's an intelligence that lives inside your community.

### 3. The City Graph: A Living Map of Urban Value 🗺️
IpêXchange renders the city as a dynamic, interactive network graph overlaid on a geographic map (built with Leaflet). 
Every resident, store, P2P listing, and event is a live node. Connections pulse with animated data flows, showing trades happening in real time. Layer toggles allow you to inspect the city across its core dimensions:
*   **Identity**: Digital citizens and their reputation scores.
*   **Commerce**: A living web of products, services, and trades.
*   **Events**: Real-time community gatherings and workshops.

### 4. Integrated Economic Infrastructure 🏦
IpêXchange isn't just a marketplace; it's a city's economic backbone.
*   **Treasury Governance**: Automatic tax collection for the city's decentralized treasury, fueling public goods.
*   **P2P Loans & Investment**: A circular finance layer where residents can fund each other's growth via decentralized loans.
*   **Recycle Hub**: A built-in circular economy service where citizens exchange unwanted materials for $IPE tokens and reputation.

### 5. Unified Store + Human Economy 🤝
Unlike platforms that segregate "peer-to-peer marketplaces" from "local businesses," IpêXchange unifies them. Residents and stores exist within the same trade network, participate in the same multi-hop cycles, and are visible on the same City Graph. From speedboats and apartments to coffee and code—everything is part of one cohesive ecosystem.

### 6. On-Chain Identity, Off-Chain Simplicity 🔐
Authentication is powered by **Privy**, providing residents with a blockchain-backed, portable, and verifiable economic identity without the friction of manually managing crypto wallets. The onboarding experience feels as simple as signing in with an email or social account.

---

## 🛠️ Technology Stack

**Frontend:**
*   **React 19** & **Vite**: Fast, modern UI development.
*   **Leaflet**: High-fidelity, custom-styled geographic mapping for the City Graph.
*   **Lucide React**: Crisp, modern iconography.
*   **Vanilla CSS**: Custom styling with deep glassmorphism and modern aesthetics.

**Backend:**
*   **Cloudflare Workers** & **Hono**: One Worker serves the SPA and the API under `/api/*`.
*   **Supabase (PostgreSQL)**: Scalable, relational database with pgvector for semantic search.
*   **Google Gemini API**: Powers "The Core" for conversational intelligence and multi-hop trade calculations.
*   **Privy**: Embedded wallets and frictionless Web3 authentication.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   npm or yarn
*   A Supabase project (for the database)
*   A Google Gemini API Key
*   A Privy App ID

### 1. Clone the Repository
```bash
git clone https://github.com/xdayon/IpeXchange.git
cd IpeXchange
```

### 2. Install and configure
```bash
npm install
cp .dev.vars.example .dev.vars   # then fill in the keys
```

`.dev.vars` keys (never commit this file):
```env
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```
Supabase is optional: without `SUPABASE_URL` and a key, or if the database is unreachable, the API falls back to in-memory demo data.

### 3. Run locally
In two terminals:
```bash
npm run dev          # Vite on http://localhost:5173, proxies /api to the Worker
npm run dev:worker   # Worker on http://localhost:8787
```

### 4. Deploy to Cloudflare
```bash
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npm run deploy       # vite build && wrangler deploy
```
The Worker `ipexchange-demo` is bound to `demo.ipexchange.xyz` (see `wrangler.jsonc`). A cron trigger pings Supabase every 6 hours so a Free project does not auto-pause. Add the domain to the allowed origins of your Privy app.

### 5. Supabase
Restore (unpause) the Supabase project, then apply the schema SQL in `supabase/` (`supabase_schema.sql`, `stores_schema.sql`, `update_schema.sql`, `multihop_v4.sql`) from the SQL editor, or run `DATABASE_URL=... npm run db:setup` for the base schema. Mock listings are seeded automatically when the listings table is empty.

---

## 🤝 Contributing
Contributions are welcome! If you're interested in building the future of community-driven economies, please feel free to submit a Pull Request or open an Issue.

## 📄 License
This project is licensed under the GNU General Public License (GPL) v3.0.
