# City Graph — Restaurar Mapa + Location Privacy

**Status:** Pronto para execução  
**Prioridade:** Crítico (mapa totalmente vazio) + Feature de Privacy  
**Estimated effort:** ~1.5 horas  
**Build:** Passa sem erros. Os bugs são em runtime no backend (Node.js), não no build Vite.

---

## 0. Diagnóstico — Por que o mapa está vazio

**Causa raiz:** O Gemini deletou a linha `const STATIC_ENTITIES = [` de `backend/lib/cityGraphBuilder.js` quando "removeu os layers antigos". As entidades ficaram como objetos JavaScript flutuantes (sem variável). Isso causa um `SyntaxError` (ou `ReferenceError`) no momento em que o servidor faz `await import('./lib/cityGraphBuilder.js')`.

O servidor captura o erro com try/catch e retorna `{ entities: [], edges: [] }` → mapa vazio.

**Prova:** O arquivo contém isso agora:
```js
// ─── Static entities for non-DB layers ─────
// (sem const STATIC_ENTITIES = [ aqui!)

  { id: 'citizen-alex', layer: 'identity', ... },
  { id: 'citizen-bia',  layer: 'identity', ... },
  ...
  { id: 'event-ai-gov', layer: 'events', ... },
];   ← o ]; existe, mas o const STATIC_ENTITIES = [ foi deletado

const SESSION_TO_CITIZEN = { ... };
```

**Fix:** Adicionar uma única linha antes do primeiro objeto.

---

## 1. Arquivos a Modificar

### 1.1 — `backend/lib/cityGraphBuilder.js` — CRÍTICO (mapa vazio)

**Ação:** Localizar o bloco de comentário abaixo e adicionar a declaração `const STATIC_ENTITIES = [` IMEDIATAMENTE depois dele, antes do primeiro `{ id: 'citizen-alex'`.

Localizar:
```js
// ─── Static entities for non-DB layers ───────────────────────────────────────
// These mirror the data from ipe-city-graph's static TypeScript files.
// They populate infrastructure, governance, safety, environment, and events layers.

  // ── Identity (citizen personas from mock sessions) ─────────────────────────
  { id: 'citizen-alex',
```

Substituir por:
```js
// ─── Static entities for non-DB layers ───────────────────────────────────────
// These mirror the data from ipe-city-graph's static TypeScript files.
// They populate commerce, identity, listings, events, and investment layers.

const STATIC_ENTITIES = [
  // ── Identity (citizen personas from mock sessions) ─────────────────────────
  { id: 'citizen-alex',
```

> **IMPORTANTE:** O `];` que fecha o array já existe no arquivo (antes de `const SESSION_TO_CITIZEN`). Não adicionar outro `];`. Apenas inserir a linha `const STATIC_ENTITIES = [` no início do bloco.

**Segundo fix no mesmo arquivo:** Atualizar `buildCityGraphPayload` para filtrar entidades `null` (necessário para a feature de privacy na seção 1.2):

Localizar:
```js
  const dbEntities = [
    ...listings.map(listingToEntity),
    ...users.map(userToEntity),
    ...stores.map(storeToEntity),
  ];
```

Substituir por:
```js
  const dbEntities = [
    ...listings.map(listingToEntity).filter(Boolean),
    ...users.map(userToEntity).filter(Boolean),
    ...stores.map(storeToEntity).filter(Boolean),
  ];
```

---

### 1.2 — Feature: Location Privacy

Esta feature adiciona a opção do usuário ocultar o localização específica do seu anúncio do mapa da cidade.

#### 1.2.1 — Supabase — Rodar no SQL Editor do Dashboard

```sql
-- Adicionar coluna de privacidade na tabela listings
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS location_privacy BOOLEAN DEFAULT false;
```

> Rodar este SQL no painel do Supabase → SQL Editor. É idempotente (usa IF NOT EXISTS).

---

#### 1.2.2 — `backend/supabase_schema.sql` — Atualizar documentação

Na tabela `listings`, adicionar a nova coluna logo após `location_lng`:

Localizar:
```sql
  location_lat FLOAT,
  location_lng FLOAT,
  active BOOLEAN DEFAULT true,
```

Substituir por:
```sql
  location_lat FLOAT,
  location_lng FLOAT,
  location_privacy BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
```

---

#### 1.2.3 — `backend/lib/supabase.js` — 3 mudanças

**Mudança A:** Na função `getCityGraphData`, adicionar `location_privacy` ao SELECT de listings:

Localizar:
```js
      supabase
        .from('listings')
        .select('id, title, description, category, subcategory, price_fiat, accepts_trade, trade_wants, provider_name, image_url, is_mock, mock_key, location_lat, location_lng, session_id')
        .eq('active', true)
        .limit(80),
```

Substituir por:
```js
      supabase
        .from('listings')
        .select('id, title, description, category, subcategory, price_fiat, accepts_trade, trade_wants, provider_name, image_url, is_mock, mock_key, location_lat, location_lng, location_privacy, session_id')
        .eq('active', true)
        .limit(80),
```

**Mudança B:** Adicionar a função `getListingsBySession` antes de `export default supabase`:

```js
export async function getListingsBySession(sessionId) {
  if (!dbAvailable || !sessionId) return [];
  const { data, error } = await supabase
    .from('listings')
    .select('id, title, category, active, location_privacy, created_at')
    .eq('session_id', sessionId)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) return [];
  return data || [];
}
```

**Mudança C:** Adicionar a função `updateListingPrivacy` antes de `export default supabase`:

```js
export async function updateListingPrivacy(listingId, sessionId, locationPrivacy) {
  if (!dbAvailable) throw new Error('DB not available');
  const { data, error } = await supabase
    .from('listings')
    .update({ location_privacy: locationPrivacy })
    .eq('id', listingId)
    .eq('session_id', sessionId)
    .select('id, location_privacy')
    .single();
  if (error) throw error;
  return data;
}
```

---

#### 1.2.4 — `backend/lib/cityGraphBuilder.js` — Filtrar entidades privadas

Na função `listingToEntity`, adicionar a verificação de privacy logo no início (antes do cálculo de `location`):

Localizar o início da função:
```js
function listingToEntity(listing) {
  const location = (listing.location_lat && listing.location_lng)
```

Substituir por:
```js
function listingToEntity(listing) {
  if (listing.location_privacy) return null;
  const location = (listing.location_lat && listing.location_lng)
```

> O `.filter(Boolean)` adicionado em 1.1 remove os `null` da lista final.

---

#### 1.2.5 — `backend/server.js` — 2 novas rotas

Adicionar antes de `app.post('/api/admin/seed'`:

```js
// ─── Listings by session ──────────────────────────────────────────────────────

app.get('/api/listings/mine', async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: 'session_id required' });
  try {
    const { getListingsBySession } = await import('./lib/supabase.js');
    const listings = await getListingsBySession(session_id);
    res.json({ listings });
  } catch (err) {
    console.error('listings/mine error:', err);
    res.status(500).json({ listings: [] });
  }
});

app.patch('/api/listings/:listingId/privacy', async (req, res) => {
  const { listingId } = req.params;
  const { session_id, location_privacy } = req.body;
  if (!session_id) return res.status(400).json({ error: 'session_id required' });
  try {
    const { updateListingPrivacy } = await import('./lib/supabase.js');
    const result = await updateListingPrivacy(listingId, session_id, location_privacy);
    res.json(result);
  } catch (err) {
    console.error('listings/privacy error:', err);
    res.status(500).json({ error: 'Failed to update privacy' });
  }
});
```

---

#### 1.2.6 — `src/lib/api.js` — 2 novas funções

Adicionar no final do arquivo (antes do último export, se houver):

```js
export async function fetchMyListingsReal(sessionId) {
  try {
    const res = await fetch(`${API_URL}/listings/mine?session_id=${encodeURIComponent(sessionId)}`);
    const data = await res.json();
    return data.listings || [];
  } catch {
    return [];
  }
}

export async function toggleListingPrivacy(listingId, sessionId, locationPrivacy) {
  const res = await fetch(`${API_URL}/listings/${listingId}/privacy`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, location_privacy: locationPrivacy }),
  });
  return res.json();
}
```

---

#### 1.2.7 — `src/components/MyListingsPage.jsx` — Seção "City Map Visibility"

Adicionar ao topo dos imports:
```js
import { MapPin, EyeOff } from 'lucide-react';
import { fetchMyListingsReal, toggleListingPrivacy } from '../lib/api';
```

Dentro do componente `HomePage`, adicionar os novos states após os existentes:
```js
const [mapListings, setMapListings] = useState([]);
const [togglingId, setTogglingId] = useState(null);
const sessionId = localStorage.getItem('ipeCoreSessionId');
```

Adicionar um `useEffect` para carregar os listings reais do mapa:
```js
useEffect(() => {
  if (!sessionId) return;
  fetchMyListingsReal(sessionId).then(setMapListings);
}, [sessionId]);
```

Adicionar a função de toggle:
```js
const handlePrivacyToggle = async (listing) => {
  setTogglingId(listing.id);
  const updated = await toggleListingPrivacy(listing.id, sessionId, !listing.location_privacy);
  setMapListings(prev => prev.map(l => l.id === listing.id ? { ...l, location_privacy: updated.location_privacy } : l));
  setTogglingId(null);
};
```

Adicionar a nova seção no JSX, **após** o grid de listagens já existente (antes do `</div>` final do container):

```jsx
{/* City Map Visibility */}
{mapListings.length > 0 && (
  <div style={{ marginTop: 32 }}>
    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
      <MapPin size={18} style={{ marginRight: 8, color: '#38BDF8', verticalAlign: 'middle' }} />
      City Map Visibility
    </h3>
    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
      Control which of your listings appear on the Ipê City live map.
    </p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {mapListings.map(listing => (
        <div
          key={listing.id}
          className="glass-panel"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}
        >
          <div>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{listing.title}</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 8 }}>{listing.category}</span>
          </div>
          <button
            onClick={() => handlePrivacyToggle(listing)}
            disabled={togglingId === listing.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
              border: listing.location_privacy
                ? '1px solid rgba(244,63,94,0.4)'
                : '1px solid rgba(34,197,94,0.4)',
              background: listing.location_privacy
                ? 'rgba(244,63,94,0.1)'
                : 'rgba(34,197,94,0.1)',
              color: listing.location_privacy ? '#F43F5E' : '#22c55e',
              opacity: togglingId === listing.id ? 0.5 : 1,
            }}
          >
            {listing.location_privacy
              ? <><EyeOff size={12} /> Hidden from map</>
              : <><MapPin size={12} /> Visible on map</>
            }
          </button>
        </div>
      ))}
    </div>
  </div>
)}
```

---

## 2. Ordem de Execução Recomendada

Executar nesta ordem exata:

1. **Supabase SQL** — rodar o ALTER TABLE no dashboard (manual, não é código)
2. `backend/supabase_schema.sql` — adicionar coluna na documentação
3. `backend/lib/cityGraphBuilder.js` — **FIX CRÍTICO** (adicionar `const STATIC_ENTITIES = [`)
4. `backend/lib/supabase.js` — 3 mudanças (SELECT + 2 funções)
5. `backend/server.js` — 2 novas rotas
6. `src/lib/api.js` — 2 novas funções
7. `src/components/MyListingsPage.jsx` — seção de visibilidade no mapa

---

## 3. O Que NÃO Mudar

| Arquivo | Status |
|---------|--------|
| `src/lib/cityGraphAdapter.js` | ✅ 5 layers corretos |
| `src/components/CityGraph/CityGraphMap.jsx` | ✅ Corrigido (sem simEngineRef) |
| `src/components/CityGraph/LayerToggle.jsx` | ✅ Ícones corretos |
| `src/components/CityGraph/SimEngine.js` | ✅ Templates + time field corretos |
| `src/components/ActivityFeed.jsx` | ✅ Usando CSS classes corretas |
| `src/components/HomePage.jsx` | ✅ SimEngine e activities state corretos |

---

## 4. Checklist de Validação

- [ ] `npm run build` passa sem erros
- [ ] Mapa carrega com **29+ nós visíveis** (15 cidadãos + 3 venues + 4 investment + 4 ocean + 3 events + real DB listings)
- [ ] Toggle de layers mostra/oculta grupos corretamente
- [ ] Animações de dots fluem entre os nós
- [ ] Feed lateral "Live Activity" atualiza a cada ~3s
- [ ] Em `MyListingsPage`, a seção "City Map Visibility" aparece quando há listings reais do usuário
- [ ] Clicar no toggle muda de "Visible on map" para "Hidden from map" e vice-versa
- [ ] Após marcar um anúncio como "Hidden", ele some do mapa na próxima vez que a página carrega
- [ ] Anúncios marcados como "Hidden" continuam aparecendo normalmente no Discovery e no chat

---

## 5. Contexto Adicional

**Como as entidades chegam ao mapa:**
- **Entidades estáticas** (cidadãos, venues, investment, ocean, events): vêm de `STATIC_ENTITIES` em `cityGraphBuilder.js` — sempre presentes
- **Listings reais** (criados via chat): vêm do Supabase via `listingToEntity()` — com `location_privacy = true`, não aparecem
- **Stores**: vêm do Supabase via `storeToEntity()` — sempre visíveis
- **Users reais**: vêm do Supabase via `userToEntity()` — sempre visíveis

**Localização dos nós:**
- Se o listing tem `location_lat` + `location_lng` preenchidos no DB: usa as coordenadas reais
- Se não tem: usa `deterministicCoords(mock_key || id)` para gerar uma posição estável dentro do polígono de Jurerê

**Session ID:** O frontend armazena o ID da sessão em `localStorage.getItem('ipeCoreSessionId')`. As rotas novas usam isso para verificar ownership antes de alterar privacidade.
