# City Graph — Hotfix: Crash + CSS + SimEngine Time Field

**Status:** Pronto para execução  
**Prioridade:** Crítico — a HomePage está completamente quebrada  
**Estimated effort:** ~30 minutos  
**Build:** Passa sem erros. O problema é em **runtime**, não em build.

---

## 1. Diagnóstico — 3 Bugs Encontrados

### Bug 1 — CRÍTICO (causa o crash completo da página)

**Arquivo:** `src/components/CityGraph/CityGraphMap.jsx`  
**Localização:** Effect 2 (label `// Effect 2: Edges + Overlays + SimEngine Update`)

O Effect 2 referencia `simEngineRef.current`, mas `simEngineRef` **não existe** no escopo de `CityGraphMap.jsx`. Essa variável foi definida em `HomePage.jsx`. Isso gera um `ReferenceError` em runtime que derruba a página inteira e aciona o error boundary com a mensagem "Something went wrong loading this page".

```js
// Este trecho em CityGraphMap.jsx está errado — simEngineRef NÃO existe aqui:
if (simEngineRef.current) {
  simEngineRef.current.setEntities(entitiesRef.current);
}
```

A comunicação correta já acontece via `onEntitiesLoad` prop: quando `fetchCityGraphData` resolve, CityGraphMap chama `onEntitiesLoad(data.entities)` → HomePage executa `simEngineRef.current.setEntities(entities)`. O bloco duplicado dentro de CityGraphMap é um erro.

---

### Bug 2 — Funcional (ActivityFeed não renderiza corretamente)

**Arquivo:** `src/components/ActivityFeed.jsx`

O componente usa classes CSS que **não existem** no projeto: `activity-feed-panel`, `activity-feed-header`, `pulse-dot`, `activity-feed-list`, `activity-feed-empty`, `activity-feed-item`, `activity-icon`, `activity-text`, `activity-time`.

O CSS existente em `src/index.css` já tem as classes corretas para o feed: `.feed-title`, `.live-dot`, `.feed-list`, `.feed-item`, `.feed-icon`, `.feed-text`, `.feed-time`. O componente precisa usar essas classes.

---

### Bug 3 — Visual (timestamps "undefined" no feed)

**Arquivo:** `src/components/CityGraph/SimEngine.js`

O callback `onActivity` cria itens com `{ id, text, color, type, ts }` mas sem o campo `time`. O componente `ActivityFeed` renderiza `{act.time}`, que fica `undefined` na tela.

---

## 2. Correções — Instruções Exatas

### Fix 1 — `src/components/CityGraph/CityGraphMap.jsx`

Localizar o Effect 2. Ele começa assim:
```js
// Effect 2: Edges + Overlays + SimEngine Update
useEffect(() => {
  if (!mapRef.current || !edgeLayerRef.current) return;
  drawEdges();
  drawOverlays();
  if (simEngineRef.current) {
    simEngineRef.current.setEntities(entitiesRef.current);
  }
}, [entities, edges, activeLayers]);
```

Substituir por (remover as 3 linhas do `simEngineRef`):
```js
// Effect 2: Edges + Overlays + SimEngine Update
useEffect(() => {
  if (!mapRef.current || !edgeLayerRef.current) return;
  drawEdges();
  drawOverlays();
}, [entities, edges, activeLayers]);
```

> **Por quê:** `simEngineRef` não existe em CityGraphMap. As entidades chegam ao SimEngine via `onEntitiesLoad` prop → `handleEntitiesLoad` em HomePage, que chama `simEngineRef.current.setEntities()` corretamente. Essa chamada duplicada é o crash.

---

### Fix 2 — `src/components/ActivityFeed.jsx`

Substituir o conteúdo completo do arquivo por:

```jsx
// src/components/ActivityFeed.jsx
import { useEffect, useRef } from 'react';

const FEED_ICONS = {
  trade:      '⇄',
  listing:    '🏷',
  event:      '📅',
  investment: '📈',
  transfer:   '→',
};

export function ActivityFeed({ activities }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [activities.length]);

  return (
    <>
      <h4 className="feed-title">
        <span className="live-dot" />
        Live Activity in Ipê City
      </h4>
      <ul ref={listRef} className="feed-list">
        {activities.length === 0 ? (
          <li style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            Waiting for activity…
          </li>
        ) : (
          activities.slice(0, 20).map(act => (
            <li key={act.id} className="feed-item">
              <span className="feed-icon" style={{ color: act.color }}>
                {FEED_ICONS[act.type] ?? '•'}
              </span>
              <span className="feed-text">{act.text}</span>
              <span className="feed-time">{act.time}</span>
            </li>
          ))
        )}
      </ul>
    </>
  );
}
```

> **Por quê:** O componente anterior usava classes CSS inventadas. Este usa as classes já existentes em `src/index.css` (`.feed-title`, `.live-dot`, `.feed-list`, `.feed-item`, `.feed-icon`, `.feed-text`, `.feed-time`).

---

### Fix 3 — `src/components/CityGraph/SimEngine.js`

Localizar o método `_step()`. Dentro dele, encontrar o bloco `this.onActivity?.({...})`:

```js
this.onActivity?.({
  id: `act-${this._tick}`,
  text: tmpl.label(src.label, tgt.label),
  color: tmpl.color,
  type: tmpl.type,
  ts: Date.now(),
});
```

Substituir por (adicionar o campo `time`):
```js
this.onActivity?.({
  id: `act-${this._tick}`,
  text: tmpl.label(src.label, tgt.label),
  color: tmpl.color,
  type: tmpl.type,
  time: 'now',
  ts: Date.now(),
});
```

> **Por quê:** O campo `time` é renderizado pelo `ActivityFeed` como timestamp. Sem ele, aparece "undefined" na tela.

---

## 3. Ordem de Execução

Aplicar nesta ordem (qualquer ordem funciona, mas esta é a mais segura):

1. `src/components/CityGraph/CityGraphMap.jsx` — remover 3 linhas do Effect 2
2. `src/components/ActivityFeed.jsx` — substituir arquivo completo
3. `src/components/CityGraph/SimEngine.js` — adicionar `time: 'now'` no `onActivity`

---

## 4. O Que NÃO Mudar

Todos os arquivos abaixo estão corretos. **Não tocar:**

| Arquivo | Status |
|---------|--------|
| `src/lib/cityGraphAdapter.js` | ✅ 5 layers corretos |
| `backend/lib/cityGraphBuilder.js` | ✅ Infra/gov/safety/env removidos, investment + ocean adicionados |
| `src/components/CityGraph/LayerToggle.jsx` | ✅ Ícones corretos (Store, Users, Tag, CalendarDays, TrendingUp) |
| `src/components/CityGraph/SimEngine.js` | ✅ Só adicionar o campo `time` no _step() |
| `src/components/HomePage.jsx` | ✅ SimEngine instanciado corretamente, activities state correto |

---

## 5. Checklist de Validação

- [ ] `npm run build` passa sem erros
- [ ] HomePage carrega sem "Something went wrong" 
- [ ] Mapa aparece com 5 layers no toggle (Stores, Citizens, Listings, Events, Investment)
- [ ] Nenhum layer de infra/gov/safety/env aparece
- [ ] Barra lateral direita mostra "Live Activity in Ipê City" com um ponto verde pulsando
- [ ] Itens aparecem no feed a cada ~3s com texto e timestamp "now"
- [ ] Listings reais aparecem no feed com timestamp "5m" ao carregar
- [ ] Animações dos dots no mapa continuam funcionando
- [ ] Hover e click nos nós funcionam
