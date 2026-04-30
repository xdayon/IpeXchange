# City Graph — Map Restructure, Ocean Fix & Live Activity Consolidation

**Status:** Pronto para execução  
**Estimated effort:** ~4–5 horas  
**Files affected:** 4 arquivos principais + 1 arquivo CSS

---

## 1. Contexto & Diagnóstico

O City Graph foi construído inicialmente baseado nas categorias do projeto `ipe-city-graph` do iggy (`infrastructure`, `governance`, `safety`, `environment`). Essas categorias não fazem parte dos produtos e serviços reais do IpêXchange.

Além disso, dois problemas visuais foram identificados:
- Alguns nós com coordenadas geradas deterministicamente caíram sobre o mar (costa norte de Jurerê).
- O "Live Activity" aparece duplicado: uma janela pequena no canto inferior esquerdo (inserida pelo `ActivityFeed.jsx`) e uma barra maior no lado direito da `HomePage.jsx` com dados mais estáticos.

---

## 2. Mudanças Planejadas

### 2.1 — Reestruturar as Categorias do Mapa

**Categorias a remover:** `infrastructure`, `governance`, `safety`, `environment`  
**Categorias a manter/adicionar:**

| ID | Label | Cor | Ícone | O que representa |
|----|-------|-----|-------|-----------------|
| `commerce` | Stores | `#B4F44A` | `Store` | Lojas físicas da cidade |
| `identity` | Citizens | `#38BDF8` | `Users` | Cidadãos e seus perfis |
| `listings` | Listings | `#A78BFA` | `Tag` | Anúncios do Discovery (Produtos, Serviços, Conhecimento, Doações) |
| `events` | Events | `#FB923C` | `CalendarDays` | Eventos da cidade |
| `investment` | Investment | `#FFC857` | `TrendingUp` | Grants e oportunidades de investimento |

> **Nota:** Os venues (Founder Haus, AI Haus, Privacy Haus) continuam como nós especiais dentro de `commerce`, com os marcadores dourados que já existem.

---

### 2.2 — Corrigir Pontos no Oceano

**Problema:** A função `deterministicCoords()` em `cityGraphBuilder.js` gera coordenadas dentro do bounding box de Jurerê, mas a região norte (lat < ~-27.440) é oceano/costa. Nós de identidade e listagens sem GPS real acabam caindo ali.

**Solução:** Definir uma lista de **coordenadas seguras em terra** para as entidades estáticas (citizens, venues, eventos, investimentos), garantindo que todos fiquem dentro do polígono habitado de Jurerê Internacional.

**Polígono aproximado de terra segura:**
```
Lat: -27.441 a -27.449 (área residencial sul)
Lon: -48.495 a -48.512
```

Entidades específicas a reposicionar para terra:
- `citizen-alex`, `citizen-luna`, `citizen-fitcoach`, `citizen-sound`, `citizen-green`, `citizen-code`, `citizen-trailco`, `citizen-skyview` — estão muito próximas da costa norte, precisam ser movidas para latitudes mais ao sul (`-27.442` a `-27.448`).

**Exceções válidas (podem ficar no mar/costa):**
- Entidades com `label` ou `description` contendo `surf`, `kitesurf`, `jet`, `catamaran`, `golfinhos`, `ocean`, `beach tour`, `mergulho`.
- Um novo conjunto de 3–4 entidades oceânicas pode ser adicionado para representar serviços no mar.

**Novos exemplos de entidades oceânicas válidas:**
```js
{ id: 'ocean-surf-school', layer: 'listings', label: 'Surf School', description: 'Aulas de surf para iniciantes e intermediários na praia de Jurerê.', location: { lat: -27.4378, lon: -48.4985 } },
{ id: 'ocean-jetski', layer: 'listings', label: 'Jet-Ski Rental', description: 'Aluguel de jet-ski por hora. Saída da orla de Jurerê Internacional.', location: { lat: -27.4365, lon: -48.5010 } },
{ id: 'ocean-catamaran', layer: 'listings', label: 'Catamaran Tour', description: 'Passeio de catamarã ao pôr do sol. Saída do Molhe Sul.', location: { lat: -27.4352, lon: -48.5050 } },
{ id: 'ocean-dolphins', layer: 'listings', label: 'Dolphin Watch Tour', description: 'Passeio guiado para observação de golfinhos. Grupos pequenos.', location: { lat: -27.4340, lon: -48.5080 } },
```

---

### 2.3 — Consolidar o Live Activity (remover duplicata)

**Situação atual:**
- `ActivityFeed.jsx` renderizado dentro do `CityGraphMap.jsx` → aparece **dentro** do mapa, canto inferior esquerdo.
- `<aside className="activity-feed">` na `HomePage.jsx` → aparece **do lado direito** do mapa, dados parcialmente estáticos.

**Solução:**
1. **Remover** `<ActivityFeed />` do `CityGraphMap.jsx` — eliminar a janelinha do canto inferior esquerdo.
2. **Transformar o `<aside className="activity-feed">`** da `HomePage.jsx` em um feed **real e dinâmico**, alimentado por:
   - Atividades simuladas do `SimEngine` (passadas via prop ou contexto de cima).
   - Dados reais do `fetchDiscoverItems` (listings recentes).
3. O `SimEngine` passará a ser inicializado na `HomePage.jsx` (não mais dentro do `CityGraphMap.jsx`), e o feed de atividade será compartilhado entre o mapa e a barra lateral.

**Nova arquitetura de dados do feed:**
```js
// Cada item do feed segue este shape:
{
  id: string,           // único
  text: string,         // ex: "Trade: Surf School ↔ Bread & Co"
  color: string,        // hex da categoria
  type: string,         // 'trade' | 'listing' | 'event' | 'investment'
  icon: ReactElement,   // Zap, TrendingUp, etc.
  time: string,         // "agora", "2m", "5m"
  ts: number,           // timestamp para ordenação
}
```

**Origem dos itens:**
- Simulados em tempo real pelo `SimEngine` (aparecem a cada ~3s com label "agora").
- Listings reais da API (aparecem uma vez no load com timestamp relativo "Xm ago").

---

## 3. Arquivos a Modificar

### 3.1 — `src/lib/cityGraphAdapter.js`

**O que muda:** Substituir os 7 layers por 5 novos layers alinhados ao IpêXchange.

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

**O que muda:**

1. **Remover** todos os `STATIC_ENTITIES` dos layers `infrastructure`, `governance`, `safety`, `environment`.
2. **Adicionar** entidades estáticas para o layer `investment` (Grants + Loans mockados):
```js
{ id: 'inv-artizen', layer: 'investment', label: 'Artizen: Regen Hub', description: 'Grant $5,000 for bio-regenerative infrastructure.', location: { lat: -27.4445, lon: -48.5062 } },
{ id: 'inv-ipe-culture', layer: 'investment', label: 'Ipê Culture Fund', description: 'Grant 2,500 RBTC for local artists and cultural events.', location: { lat: -27.4432, lon: -48.5034 } },
{ id: 'inv-bread-loan', layer: 'investment', label: 'Bread & Co Expansion', description: 'Loan $1,200 — oven upgrade for sourdough bakery.', location: { lat: -27.4438, lon: -48.5018 } },
{ id: 'inv-climate-loan', layer: 'investment', label: 'Eco-Sensor Network', description: 'Loan 500 USDC — 20 new air quality sensors for South Sector.', location: { lat: -27.4453, lon: -48.5045 } },
```

3. **Adicionar** entidades oceânicas no layer `listings`:
```js
{ id: 'ocean-surf-school', layer: 'listings', label: 'Surf School', description: 'Surf lessons for beginners and intermediate. Jurerê beach.', location: { lat: -27.4378, lon: -48.4985 } },
{ id: 'ocean-jetski', layer: 'listings', label: 'Jet-Ski Rental', description: 'Hourly jet-ski rental. Departs from Jurerê Internacional shore.', location: { lat: -27.4365, lon: -48.5010 } },
{ id: 'ocean-catamaran', layer: 'listings', label: 'Sunset Catamaran', description: 'Catamaran tour at sunset. Departs from the South Pier.', location: { lat: -27.4352, lon: -48.5050 } },
{ id: 'ocean-dolphins', layer: 'listings', label: 'Dolphin Watch Tour', description: 'Guided small-group dolphin watching experience.', location: { lat: -27.4340, lon: -48.5080 } },
```

4. **Reposicionar** todos os `STATIC_ENTITIES` de `identity` que estão na costa norte para latitudes > -27.441 (sul, terra firme).

5. **Atualizar** a função `listingToEntity()` para usar `layer: 'listings'` ao invés de `layer: 'commerce'`.

6. **Atualizar** a função `storeToEntity()` para manter `layer: 'commerce'` (lojas físicas são commerce, correto).

7. **Remover** dos `STATIC_EDGES` todas as referências a `infra-*`, `gov-*`, `safety-*`, `env-*`.

8. **Adicionar** novas edges estáticas entre `investment` e `identity`/`commerce`:
```js
{ id: 'e-artizen-community', source: 'inv-artizen', target: 'citizen-green', relationship: 'funded-by', label: 'Applicant' },
{ id: 'e-bread-loan-bread', source: 'inv-bread-loan', target: 'venue-founder-haus', relationship: 'backed-by', label: 'Backed by' },
```

---

### 3.3 — `src/components/CityGraph/CityGraphMap.jsx`

**O que muda:**

1. **Remover** a importação e renderização do `<ActivityFeed />`.
2. **Mover** a lógica do `SimEngine` para fora do `CityGraphMap`:
   - O `SimEngine` será instanciado na `HomePage.jsx`.
   - O `CityGraphMap` receberá uma prop `onSimEdge` (callback) para receber os dots de animação sem precisar do state do feed.
   - Remover `activities` state e `handleActivity` callback do componente.
3. **Atualizar** o `SimEngine` para respeitar apenas os layers do novo schema (`commerce`, `identity`, `listings`, `events`, `investment`).
4. **Atualizar** a lógica de markers para não renderizar mais nós de `safety`, `environment`, `infrastructure`, `governance`.

**Nova assinatura do componente:**
```jsx
export default function CityGraphMap({ onSimEdge, onActivity }) { ... }
```

---

### 3.4 — `src/components/CityGraph/ActivityFeed.jsx`

**O que muda:** Mover para `src/components/ActivityFeed.jsx` (fora do CityGraph) e adaptar o layout para a barra lateral da HomePage.

**Novo design da barra lateral:**
- Header: `🔴 Live Activity in Ipê City` com pulse dot animado.
- Lista de items com:
  - Ícone colorido por tipo (trade = ⇄, listing = Tag, event = Calendar, investment = TrendingUp).
  - Texto descritivo.
  - Timestamp relativo ("agora", "2m ago", "5m ago").
- Auto-scroll para o item mais recente.
- Máximo 20 itens (os mais antigos saem).
- Items reais da API ficam na base; items simulados vão ao topo.

---

### 3.5 — `src/components/HomePage.jsx`

**O que muda:**

1. **Instanciar o `SimEngine`** aqui, passando:
   - `onSimEdge` → enviado como prop para o `<CityGraphMap />`.
   - `onActivity` → atualiza o state `activities` da HomePage.

2. **Substituir** a lógica atual do `liveFeed` (que vinha de `fetchDiscoverItems`) para ser gerenciada por um state `activities` unificado.

3. **Popular** o feed inicial com os últimos listings reais ao montar:
```js
const initialItems = listings.slice(0, 5).map(l => ({
  id: `real-${l.id}`,
  text: `New listing: ${l.title}`,
  color: '#A78BFA',
  type: 'listing',
  icon: <Tag size={14} />,
  time: '5m',
  ts: Date.now() - 300000,
}));
setActivities(initialItems);
```

4. **Renderizar** o novo `<ActivityFeed activities={activities} />` dentro do `<aside className="activity-feed">`.

5. **Passar** `onSimEdge` e `onActivity` ao `<CityGraphMap />`.

---

### 3.6 — `LayerToggle.jsx` — Atualizar ícones

**O que muda:** Adicionar o ícone `Tag` e `TrendingUp` para os novos layers.

```jsx
import { ..., Tag, TrendingUp } from 'lucide-react';
const ICONS = { Store, Users, Tag, CalendarDays, TrendingUp };
```

---

## 4. Arquitetura Final do Fluxo

```
HomePage.jsx
├── instancia SimEngine
│   ├── onSimEdge → prop para CityGraphMap (anima dot no mapa)
│   └── onActivity → atualiza state `activities`
├── activities state (real + simulado) → ActivityFeed (barra direita)
└── CityGraphMap
    ├── recebe onSimEdge como prop
    ├── usa simLayerRef para plotar dots simulados
    └── NÃO tem mais ActivityFeed interno
```

---

## 5. SimEngine — Atualizar Templates

Os templates do SimEngine devem usar as categorias reais:

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

## 6. Resumo das Mudanças por Arquivo

| Arquivo | Tipo | O que muda |
|---------|------|------------|
| `src/lib/cityGraphAdapter.js` | MODIFY | 5 novos layers alinhados ao IpêXchange |
| `backend/lib/cityGraphBuilder.js` | MODIFY | Remove infra/gov/safety/env, adiciona investment + ocean listings, reposiciona nós na terra |
| `src/components/CityGraph/CityGraphMap.jsx` | MODIFY | Remove ActivityFeed interno, recebe onSimEdge como prop |
| `src/components/CityGraph/ActivityFeed.jsx` | MOVE+MODIFY | Move para `src/components/`, adapta para barra lateral direita |
| `src/components/CityGraph/SimEngine.js` | MODIFY | Atualiza templates para categorias reais |
| `src/components/CityGraph/LayerToggle.jsx` | MODIFY | Adiciona ícones Tag e TrendingUp |
| `src/components/HomePage.jsx` | MODIFY | Instancia SimEngine, gerencia activities state, passa props para CityGraphMap |

---

## 7. Checklist de Validação

- [ ] 5 layers corretos aparecem no toggle lateral (Stores, Citizens, Listings, Events, Investment)
- [ ] Nenhum layer de infra/gov/safety/env está presente
- [ ] Todos os nós de cidadãos estão em terra (lat < -27.441)
- [ ] Nós oceânicos (surf, jet-ski, catamarã, golfinhos) estão visualmente na água
- [ ] LiveActivity aparece **apenas** na barra lateral direita do mapa
- [ ] A janelinha inferior esquerda (ActivityFeed antigo) NÃO aparece mais dentro do mapa
- [ ] O feed atualiza em tempo real com novos eventos simulados a cada ~3s
- [ ] Os listings reais aparecem no feed ao carregar a página
- [ ] Animações dos dots continuam fluindo normalmente após a reestruturação
- [ ] Hover e click nos nós funcionam sem resetar animações
- [ ] Toggle de layers esconde/mostra os nós e suas arestas corretamente
