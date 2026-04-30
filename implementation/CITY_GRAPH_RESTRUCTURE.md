# City Graph — Map Restructure, Ocean Fix & Live Activity Consolidation

**Status:** Pronto para re-execução (primeira tentativa falhou no deploy — ver diagnóstico abaixo)  
**Estimated effort:** ~4–5 horas  
**Files affected:** 6 arquivos

---

## 0. Diagnóstico da Falha Anterior

A primeira execução deste plano (commit `6539a4c`) causou um erro de build no Render:

```
[UNRESOLVED_IMPORT] Could not resolve './ActivityFeed' in CityGraphMap.jsx
import { ActivityFeed } from "./ActivityFeed";   ← linha não removida
```

**O que aconteceu:** O arquivo `src/components/CityGraph/ActivityFeed.jsx` foi deletado, mas a linha `import { ActivityFeed } from "./ActivityFeed"` no topo de `CityGraphMap.jsx` não foi removida. O build quebrou porque o módulo importado não existia mais.

**Commits de correção posteriores (`8ae1036`, `dcf4395`, `1711f39`)** resolveram o erro com um workaround: a `ActivityFeed` foi reimplementada como uma **função local inline** dentro de `CityGraphMap.jsx`, em vez de ser movida para `src/components/`.

---

## 1. Estado Atual do Código (pós-fix)

Antes de executar qualquer mudança, confirme que estes estados são verdadeiros:

| Arquivo | Estado atual |
|---------|-------------|
| `src/lib/cityGraphAdapter.js` | **INALTERADO** — ainda tem 7 layers antigos: `commerce`, `identity`, `infrastructure`, `governance`, `safety`, `environment`, `events` |
| `backend/lib/cityGraphBuilder.js` | **INALTERADO** — ainda tem entidades `infra-*`, `gov-*`, `safety-*`, `env-*` |
| `src/components/CityGraph/CityGraphMap.jsx` | **PARCIALMENTE ALTERADO** — `ActivityFeed` existe como função local inline (não importada); `SimEngine` e `activities` state ainda estão aqui |
| `src/components/CityGraph/ActivityFeed.jsx` | **NÃO EXISTE** (foi deletado) |
| `src/components/CityGraph/LayerToggle.jsx` | **INALTERADO** — ícones `Cpu, Vote, ShieldAlert, Leaf` ainda importados |
| `src/components/CityGraph/SimEngine.js` | **INALTERADO** — templates antigos (`vote`, `purchase`, `connect`) |
| `src/components/HomePage.jsx` | **INALTERADO** — não instancia SimEngine, não tem activities state |

---

## 2. Objetivo Final

### Categorias do mapa

**Remover:** `infrastructure`, `governance`, `safety`, `environment`  
**Manter/adicionar:**

| ID | Label | Cor | Ícone | O que representa |
|----|-------|-----|-------|-----------------|
| `commerce` | Stores | `#B4F44A` | `Store` | Lojas físicas da cidade |
| `identity` | Citizens | `#38BDF8` | `Users` | Cidadãos e seus perfis |
| `listings` | Listings | `#A78BFA` | `Tag` | Anúncios do Discovery |
| `events` | Events | `#FB923C` | `CalendarDays` | Eventos da cidade |
| `investment` | Investment | `#FFC857` | `TrendingUp` | Grants e oportunidades de investimento |

> Os venues (Founder Haus, AI Haus, Privacy Haus) continuam como nós especiais dentro de `commerce`.

### Live Activity

- `ActivityFeed` deixa de existir dentro de `CityGraphMap` (nem inline, nem importado).
- `SimEngine` é instanciado na `HomePage.jsx`, não no `CityGraphMap`.
- Feed dinâmico aparece **somente** na barra lateral direita da `HomePage`.

---

## 3. Arquivos a Modificar — Instruções Detalhadas

### 3.1 — `src/lib/cityGraphAdapter.js`

**Ação:** Substituir o array `LAYER_META` inteiro pelo novo.

Substituir:
```js
export const LAYER_META = [
  { id: 'commerce',       label: 'Commerce',       color: '#B4F44A', icon: 'Store' },
  { id: 'identity',       label: 'Citizens',        color: '#38BDF8', icon: 'Users' },
  { id: 'infrastructure', label: 'Infrastructure',  color: '#F59E0B', icon: 'Cpu' },
  { id: 'governance',     label: 'Governance',      color: '#818CF8', icon: 'Vote' },
  { id: 'safety',         label: 'Safety',          color: '#F43F5E', icon: 'ShieldAlert' },
  { id: 'environment',    label: 'Environment',     color: '#34D399', icon: 'Leaf' },
  { id: 'events',         label: 'Events',          color: '#FB923C', icon: 'CalendarDays' },
];
```

Por:
```js
export const LAYER_META = [
  { id: 'commerce',   label: 'Stores',      color: '#B4F44A', icon: 'Store' },
  { id: 'identity',   label: 'Citizens',    color: '#38BDF8', icon: 'Users' },
  { id: 'listings',   label: 'Listings',    color: '#A78BFA', icon: 'Tag' },
  { id: 'events',     label: 'Events',      color: '#FB923C', icon: 'CalendarDays' },
  { id: 'investment', label: 'Investment',  color: '#FFC857', icon: 'TrendingUp' },
];
```

---

### 3.2 — `backend/lib/cityGraphBuilder.js`

**Ações (cada uma obrigatória):**

**3.2.1** — Remover do array `STATIC_ENTITIES` todos os objetos com `layer: 'infrastructure'`, `layer: 'governance'`, `layer: 'safety'`, `layer: 'environment'`. Manter apenas os de `layer: 'commerce'`, `layer: 'identity'`, `layer: 'events'`.

**3.2.2** — No array `STATIC_ENTITIES`, reposicionar os cidadãos com latitude acima de `-27.441` (que caem no oceano) para latitudes entre `-27.442` e `-27.448`. Os IDs afetados são: `citizen-alex`, `citizen-luna`, `citizen-fitcoach`, `citizen-sound`, `citizen-green`, `citizen-code`, `citizen-trailco`, `citizen-skyview`.

**3.2.3** — Adicionar ao array `STATIC_ENTITIES` as seguintes entidades de investimento:
```js
{ id: 'inv-artizen',      layer: 'investment', label: 'Artizen: Regen Hub',    description: 'Grant $5,000 for bio-regenerative infrastructure.',              location: { lat: -27.4445, lon: -48.5062 } },
{ id: 'inv-ipe-culture',  layer: 'investment', label: 'Ipê Culture Fund',       description: 'Grant 2,500 RBTC for local artists and cultural events.',         location: { lat: -27.4432, lon: -48.5034 } },
{ id: 'inv-bread-loan',   layer: 'investment', label: 'Bread & Co Expansion',   description: 'Loan $1,200 — oven upgrade for sourdough bakery.',                location: { lat: -27.4438, lon: -48.5018 } },
{ id: 'inv-climate-loan', layer: 'investment', label: 'Eco-Sensor Network',     description: 'Loan 500 USDC — 20 new air quality sensors for South Sector.',    location: { lat: -27.4453, lon: -48.5045 } },
```

**3.2.4** — Adicionar ao array `STATIC_ENTITIES` as seguintes entidades oceânicas (layer `listings`):
```js
{ id: 'ocean-surf-school', layer: 'listings', label: 'Surf School',        description: 'Surf lessons for beginners and intermediate. Jurerê beach.',             location: { lat: -27.4378, lon: -48.4985 } },
{ id: 'ocean-jetski',      layer: 'listings', label: 'Jet-Ski Rental',     description: 'Hourly jet-ski rental. Departs from Jurerê Internacional shore.',        location: { lat: -27.4365, lon: -48.5010 } },
{ id: 'ocean-catamaran',   layer: 'listings', label: 'Sunset Catamaran',   description: 'Catamaran tour at sunset. Departs from the South Pier.',                 location: { lat: -27.4352, lon: -48.5050 } },
{ id: 'ocean-dolphins',    layer: 'listings', label: 'Dolphin Watch Tour', description: 'Guided small-group dolphin watching experience.',                         location: { lat: -27.4340, lon: -48.5080 } },
```

**3.2.5** — Na função `listingToEntity()`, alterar `layer: 'commerce'` para `layer: 'listings'`.

**3.2.6** — No array `STATIC_EDGES`, remover todos os objetos em que `source` ou `target` começam com `infra-`, `gov-`, `safety-`, `env-`.

**3.2.7** — Adicionar ao array `STATIC_EDGES`:
```js
{ id: 'e-artizen-community', source: 'inv-artizen',    target: 'citizen-green',     relationship: 'funded-by', label: 'Applicant' },
{ id: 'e-bread-loan-bread',  source: 'inv-bread-loan', target: 'venue-founder-haus', relationship: 'backed-by', label: 'Backed by' },
```

---

### 3.3 — `src/components/CityGraph/CityGraphMap.jsx`

**Contexto:** Após os commits de fix, `ActivityFeed` existe como uma função local inline dentro deste arquivo (não é importada). O `SimEngine` é instanciado aqui e o `activities` state também vive aqui.

**Ações obrigatórias:**

**3.3.1** — Remover **completamente** o bloco da função local `ActivityFeed` (do comentário `// ─── Inline ActivityFeed` até o fechamento da função). Não existe import a remover — ela é uma função local, então deletar o corpo da função é suficiente.

**3.3.2** — Remover o `useState` de `activities`:
```js
const [activities, setActivities] = useState([]);  // ← deletar esta linha
```

**3.3.3** — Remover o callback `handleActivity`:
```js
const handleActivity = useCallback((act) => {
  setActivities(prev => [...prev.slice(-11), act]);
}, []);  // ← deletar este bloco inteiro
```

**3.3.4** — No trecho onde o `SimEngine` é instanciado (dentro de um `useEffect`), remover a inicialização local e substituir por uma chamada ao `onSimEdge` recebido como prop. O componente não deve mais instanciar `SimEngine` por conta própria. Remover:
```js
const sim = new SimEngine({
  onSimEdge: handleSimEdge,
  onActivity: handleActivity,
  ...
});
```
E também remover o `import { SimEngine } from './SimEngine'` do topo do arquivo, pois o SimEngine passará a ser instanciado na `HomePage.jsx`.

**3.3.5** — Remover do JSX a renderização `<ActivityFeed activities={activities} />` (que está no canto inferior esquerdo do mapa).

**3.3.6** — Atualizar a assinatura da função para aceitar as props externas:
```jsx
export default function CityGraphMap({ onSimEdge, onActivity }) { ... }
```
O `handleSimEdge` interno deve chamar `onSimEdge` (prop) quando receber um evento do SimEngine — mas como o SimEngine agora vive na HomePage, o `onSimEdge` será uma referência externa que a HomePage passa diretamente para o CityGraphMap usar como callback de animação.

---

### 3.4 — CRIAR `src/components/ActivityFeed.jsx` (arquivo novo)

**Este arquivo não existe.** Criar com o seguinte conteúdo:

```jsx
// src/components/ActivityFeed.jsx
import { useEffect, useRef } from 'react';

const ACTIVITY_ICONS = {
  trade:      '⇄',
  listing:    '🏷',
  event:      '📅',
  investment: '📈',
  transfer:   '→',
};

export function ActivityFeed({ activities }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [activities.length]);

  return (
    <div className="activity-feed-panel">
      <div className="activity-feed-header">
        <span className="pulse-dot" />
        Live Activity in Ipê City
      </div>
      <ul ref={listRef} className="activity-feed-list">
        {activities.length === 0 ? (
          <li className="activity-feed-empty">Waiting for activity…</li>
        ) : (
          activities.slice(0, 20).map(act => (
            <li key={act.id} className="activity-feed-item">
              <span className="activity-icon" style={{ color: act.color }}>
                {ACTIVITY_ICONS[act.type] ?? '•'}
              </span>
              <span className="activity-text">{act.text}</span>
              <span className="activity-time">{act.time}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
```

---

### 3.5 — `src/components/HomePage.jsx`

**Ações:**

**3.5.1** — Importar no topo do arquivo:
```js
import { SimEngine } from './CityGraph/SimEngine';
import { ActivityFeed } from './ActivityFeed';
import { Tag, TrendingUp, CalendarDays, Zap } from 'lucide-react';
```

**3.5.2** — Adicionar state de activities:
```js
const [activities, setActivities] = useState([]);
```

**3.5.3** — Instanciar o `SimEngine` em um `useEffect` (após o mount):
```js
useEffect(() => {
  const sim = new SimEngine({
    onSimEdge: (edge) => {
      // edge é passado como prop para CityGraphMap via callback
      if (simEdgeCallbackRef.current) simEdgeCallbackRef.current(edge);
    },
    onActivity: (act) => {
      setActivities(prev => [act, ...prev].slice(0, 20));
    },
    nodes: [],  // CityGraphMap vai preencher via ref
  });
  sim.start();
  return () => sim.stop();
}, []);
```

> **Nota:** Para passar a referência do `onSimEdge` para o CityGraphMap sem re-render, usar um `useRef` como `simEdgeCallbackRef`:
> ```js
> const simEdgeCallbackRef = useRef(null);
> ```
> E passar para o CityGraphMap:
> ```jsx
> <CityGraphMap onRegisterSimEdge={(fn) => { simEdgeCallbackRef.current = fn; }} ... />
> ```
> Dentro do `CityGraphMap`, expor o callback chamando `onRegisterSimEdge(handleSimEdge)` no mount.

**3.5.4** — Popular o feed inicial com listings reais ao carregar:
```js
useEffect(() => {
  if (!listings?.length) return;
  const initialItems = listings.slice(0, 5).map(l => ({
    id: `real-${l.id}`,
    text: `New listing: ${l.title}`,
    color: '#A78BFA',
    type: 'listing',
    time: '5m',
    ts: Date.now() - 300000,
  }));
  setActivities(initialItems);
}, [listings]);
```

**3.5.5** — Dentro do JSX, na barra lateral `<aside className="activity-feed">`, substituir o conteúdo atual pelo componente novo:
```jsx
<aside className="activity-feed">
  <ActivityFeed activities={activities} />
</aside>
```

---

### 3.6 — `src/components/CityGraph/LayerToggle.jsx`

**Ação:** Atualizar imports e o mapa de ícones para incluir os novos layers e remover os antigos.

Substituir a linha de import:
```js
import { Eye, EyeOff, Users, Cpu, Vote, Store, ShieldAlert, Leaf, CalendarDays } from 'lucide-react';
```
Por:
```js
import { Eye, EyeOff, Users, Store, Tag, CalendarDays, TrendingUp } from 'lucide-react';
```

Substituir:
```js
const ICONS = { Users, Cpu, Vote, Store, ShieldAlert, Leaf, CalendarDays };
```
Por:
```js
const ICONS = { Store, Users, Tag, CalendarDays, TrendingUp };
```

---

### 3.7 — `src/components/CityGraph/SimEngine.js`

**Ação:** Atualizar os templates para refletir as categorias reais do IpêXchange.

Substituir o array `TEMPLATES` pelo seguinte:
```js
const TEMPLATES = [
  { type: 'trade',      label: (a, b) => `Trade: ${a} ↔ ${b}`,       color: '#7AE7FF' },
  { type: 'listing',    label: (a, b) => `New offer: ${a} → ${b}`,    color: '#A78BFA' },
  { type: 'event',      label: (a, b) => `${b} confirmed ${a}`,       color: '#FB923C' },
  { type: 'investment', label: (a, b) => `${a} applied to ${b}`,      color: '#FFC857' },
  { type: 'transfer',   label: (a, b) => `Transfer: ${a} → ${b}`,     color: '#B4F44A' },
];
```

---

## 4. Arquitetura Final do Fluxo

```
HomePage.jsx
├── instancia SimEngine via useEffect
│   ├── onSimEdge → repassado via ref para CityGraphMap (anima dot no mapa)
│   └── onActivity → atualiza state `activities` na HomePage
├── activities state (real + simulado) → <ActivityFeed /> (barra lateral direita)
└── <CityGraphMap onRegisterSimEdge={...} />
    ├── registra handleSimEdge via onRegisterSimEdge no mount
    ├── usa simLayerRef para plotar dots simulados
    └── NÃO tem mais ActivityFeed (nem inline, nem importado)
        NÃO instancia SimEngine
        NÃO tem activities state
```

---

## 5. Resumo das Mudanças por Arquivo

| Arquivo | Tipo | O que muda |
|---------|------|------------|
| `src/lib/cityGraphAdapter.js` | MODIFY | Substituir 7 layers antigos pelos 5 novos |
| `backend/lib/cityGraphBuilder.js` | MODIFY | Remove infra/gov/safety/env, adiciona investment + ocean, reposiciona cidadãos |
| `src/components/CityGraph/CityGraphMap.jsx` | MODIFY | Remove ActivityFeed inline + activities state + SimEngine init |
| `src/components/ActivityFeed.jsx` | CREATE | Novo arquivo — componente para barra lateral da HomePage |
| `src/components/CityGraph/SimEngine.js` | MODIFY | Atualiza templates para categorias reais |
| `src/components/CityGraph/LayerToggle.jsx` | MODIFY | Substitui ícones antigos por Tag e TrendingUp |
| `src/components/HomePage.jsx` | MODIFY | Instancia SimEngine, gerencia activities state, renderiza ActivityFeed |

---

## 6. Ordem de Execução Recomendada

Executar nesta ordem para evitar erros intermediários de build:

1. `src/lib/cityGraphAdapter.js` — layers
2. `backend/lib/cityGraphBuilder.js` — entidades e edges
3. `src/components/ActivityFeed.jsx` — **criar o arquivo primeiro** (antes de modificar HomePage)
4. `src/components/CityGraph/LayerToggle.jsx` — ícones
5. `src/components/CityGraph/SimEngine.js` — templates
6. `src/components/CityGraph/CityGraphMap.jsx` — remover ActivityFeed inline, activities state, SimEngine init
7. `src/components/HomePage.jsx` — instanciar SimEngine, usar ActivityFeed

---

## 7. Checklist de Validação

- [ ] 5 layers corretos aparecem no toggle lateral (Stores, Citizens, Listings, Events, Investment)
- [ ] Nenhum layer de infra/gov/safety/env está presente
- [ ] Todos os nós de cidadãos estão em terra (lat < -27.441)
- [ ] Nós oceânicos (surf, jet-ski, catamarã, golfinhos) estão visualmente na água
- [ ] LiveActivity aparece **apenas** na barra lateral direita da HomePage
- [ ] Nenhum `ActivityFeed` existe dentro de `CityGraphMap.jsx` (nem inline, nem importado)
- [ ] O feed atualiza em tempo real com novos eventos simulados a cada ~3s
- [ ] Os listings reais aparecem no feed ao carregar a página
- [ ] Animações dos dots continuam fluindo normalmente após a reestruturação
- [ ] Hover e click nos nós funcionam sem resetar animações
- [ ] Toggle de layers esconde/mostra os nós e suas arestas corretamente
- [ ] `npm run build` passa sem erros de import não resolvido
