# City Graph — Final Build Fix (ActivityFeed Inline)

**Status:** Pronto para execução  
**Prioridade:** CRÍTICO — Build quebrado na Render  
**Estimated effort:** ~20 minutos  

---

## 1. Causa Raiz

O arquivo `src/components/ActivityFeed.jsx` **nunca existiu no git**. Ele foi criado na sessão anterior mas ficou num path com caractere especial (`Ipê`) que impediu o commit de incluí-lo. 

O `CityGraphMap.jsx` tenta importá-lo com:
```js
import { ActivityFeed } from '../ActivityFeed';
```
→ Arquivo não existe → Build falha na Render.

---

## 2. Solução Definitiva

**Embutir o componente `ActivityFeed` diretamente no `CityGraphMap.jsx`**, eliminando a dependência de arquivo externo. Isso é mais robusto: um único arquivo, zero risco de import quebrado.

Além disso, o `ActivityFeed` que fica dentro do mapa (canto inferior esquerdo com o feed de atividade simulada) vai continuar existindo e funcionando — não muda nada visualmente.

---

## 3. Mudanças

### 3.1 — `src/components/CityGraph/CityGraphMap.jsx` — [MODIFY]

**Remover** o import externo problemático:
```diff
- import { ActivityFeed } from '../ActivityFeed';
```

**Adicionar** o componente `ActivityFeed` inline no próprio arquivo, logo após os imports (antes do `const SW = ...`):

```jsx
// ─── Inline ActivityFeed (embedded to avoid external file dependency) ─────────

const ACTIVITY_ICONS = {
  trade:      '⇄',
  listing:    '🏷',
  event:      '📅',
  investment: '📈',
  transfer:   '→',
};

function ActivityFeed({ activities }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: 16,
      left: 16,
      zIndex: 600,
      width: 280,
      maxHeight: 220,
      background: 'rgba(4,18,36,0.88)',
      border: '1px solid rgba(122,231,255,0.15)',
      borderRadius: 14,
      backdropFilter: 'blur(12px)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      pointerEvents: 'none',
    }}>
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'rgba(122,231,255,0.8)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#B4F44A',
          boxShadow: '0 0 6px #B4F44A',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
        Live Activity
      </div>
      <ul style={{ margin: 0, padding: '6px 0', listStyle: 'none', overflowY: 'auto', flex: 1 }}>
        {activities.length === 0 ? (
          <li style={{ padding: '8px 14px', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
            Waiting for activity…
          </li>
        ) : (
          activities.slice(0, 6).map(act => (
            <li key={act.id} style={{
              padding: '7px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <span style={{
                fontSize: 12,
                color: act.color,
                background: `${act.color}18`,
                width: 22,
                height: 22,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {ACTIVITY_ICONS[act.type] || '⚡'}
              </span>
              <span style={{
                fontSize: 11,
                lineHeight: 1.4,
                color: 'rgba(255,255,255,0.7)',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}>
                {act.text}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
```

---

## 4. Nenhum Outro Arquivo Precisa Ser Alterado

- `src/components/HomePage.jsx` — **manter como está** (versão original, funcional)
- `src/components/CityGraph/SimEngine.js` — **manter como está**
- `src/components/CityGraph/LayerToggle.jsx` — **manter como está**
- `src/lib/cityGraphAdapter.js` — **manter como está**
- `backend/lib/cityGraphBuilder.js` — **manter como está**

---

## 5. Passos de Execução

1. Abrir `src/components/CityGraph/CityGraphMap.jsx`.
2. Remover a linha: `import { ActivityFeed } from '../ActivityFeed';`
3. Após o bloco de imports (depois da linha com `import { LayerToggle }`), adicionar o componente `ActivityFeed` inline completo (código na seção 3.1).
4. Verificar build local: `npm run build`
5. Commit e push.

---

## 6. Verificação

```bash
cd "/home/dx/Projects/Ipê Connect/IpeXchange"
npm run build
```

Resultado esperado:
```
✓ built in X.XXs
```

```bash
git add src/components/CityGraph/CityGraphMap.jsx
git commit -m "fix: inline ActivityFeed in CityGraphMap — resolves build import error"
git push origin main
```

---

## 7. Checklist

- [ ] Linha `import { ActivityFeed } from '../ActivityFeed'` REMOVIDA
- [ ] Componente `ActivityFeed` inline adicionado antes do `const SW = ...`  
- [ ] `npm run build` passa sem erros
- [ ] Deploy na Render bem-sucedido
- [ ] HomePage carrega normalmente
- [ ] Live Activity aparece no canto inferior esquerdo do mapa
- [ ] Animações dos dots funcionando
