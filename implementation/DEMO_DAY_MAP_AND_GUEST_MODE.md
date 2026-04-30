# Demo Day — Map Refresh Fix + Guest Mode Jean Hansen

**Status:** Pronto para execução em 2 etapas independentes  
**Demo deadline:** 2026-05-01  
**Estimated effort total:** ~1.5 horas

---

## DIAGNÓSTICOS

### Bug A — Mapa piscando / nós sumindo

**Causa raiz:** `src/components/HomePage.jsx` linha 105 passa `onRegisterSimEdge` como arrow function inline:
```jsx
onRegisterSimEdge={(fn) => { simEdgeCallbackRef.current = fn; }}
```
Cada vez que `setActivities` é chamado (~3s), `HomePage` re-renderiza e cria uma **nova referência de função**. O Leaflet init `useEffect` em `CityGraphMap` tem `onRegisterSimEdge` no array de dependências — ao detectar a mudança, ele **destrói e recria o mapa inteiro**, causando o blink e apagando todos os nós.

**Fix:** Uma linha — envolver em `useCallback`.

---

### Bug B — Guest mode sem animação de onboarding

**Causa:** `App.jsx` tem uma lógica que, ao detectar `ipeXchange_demoSession`, pula `ConnectAgentScreen` e `SyncScreen` e vai direto ao `portal`. O usuário nunca vê a animação.

**Fix:** Remover o bloco de desvio.

---

### Bug C — Profile Jean Hansen (nome, reputação, histórico)

**Causa:** `ProfilePage.jsx` calcula `heroName` como `shortWallet` quando não há email — para o demo, `shortWallet = '0x73a...Hansen'` → exibe feio. Além disso, `fetchUserTransactions` faz call real à API (retorna vazio para demo). A seção de Web of Trust e os Badges de DEMO_USER existem nos dados mas não são renderizados.

---

### Bug D — WalletPage vazia no guest mode

**Causa:** `WalletPage` usa `getPurchases()` e `getMyListings()` do xchangeStore (localStorage). Em uma sessão nova de guest, o localStorage está vazio.

---

## ETAPA 1 — Map Refresh Fix (5 minutos)

### 1.1 — `src/components/HomePage.jsx`

Localizar:
```jsx
<CityGraphMap 
  onRegisterSimEdge={(fn) => { simEdgeCallbackRef.current = fn; }} 
  onEntitiesLoad={handleEntitiesLoad}
/>
```

Substituir por (envolver em `useCallback` definido antes do return):

**Passo A:** Adicionar o callback logo após `handleEntitiesLoad` (que já existe):
```js
const handleRegisterSimEdge = useCallback((fn) => {
  simEdgeCallbackRef.current = fn;
}, []);
```

**Passo B:** Atualizar o JSX:
```jsx
<CityGraphMap 
  onRegisterSimEdge={handleRegisterSimEdge}
  onEntitiesLoad={handleEntitiesLoad}
/>
```

> **Por quê:** `useCallback` com `[]` garante referência estável entre renders. O useEffect do Leaflet não dispara mais a cada update do feed, e o mapa não é destruído/recriado.

---

## ETAPA 2 — Guest Mode Jean Hansen (1 hora)

### 2.1 — `src/App.jsx` — Restaurar animação de onboarding para guest

Localizar e **deletar** o bloco inteiro de desvio:
```js
// If we just logged in via Demo Mode, jump straight to portal
if (newState === 'agent' && localStorage.getItem('ipeXchange_demoSession')) {
  localStorage.setItem('ipeXchangeState', 'portal');
  localStorage.setItem('ipeXchange_agentConnected', 'true');
  setAppState('portal');
  return;
}
```

> Após a remoção, o guest mode segue o mesmo fluxo de qualquer usuário: `login → agent (ConnectAgentScreen) → sync (SyncScreen) → portal`. O `ipeXchange_demoSession` ainda é lido pelo `UserContext` para carregar os dados de Jean Hansen.

---

### 2.2 — `src/data/demoProfile.js` — Adicionar dados faltantes

Adicionar no final do arquivo (antes do último `export` ou após `DEMO_PURCHASES`):

```js
// Transactions para ProfilePage (formato esperado pela API)
export const DEMO_TRANSACTIONS = [
  {
    id: 'dtx1',
    direction: 'out',
    listing: { title: 'Vinyasa Yoga — 10 Class Pack' },
    amount_fiat: 120,
    is_trade: false,
    is_private: false,
    counterparty: '0xA1b2C3d4E5f6...G7h8',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'dtx2',
    direction: 'in',
    listing: { title: 'Full-Stack Web3 Development' },
    amount_fiat: null,
    is_trade: true,
    is_private: false,
    counterparty: '0xE5f6G7h8I9j0...K1l2',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'dtx3',
    direction: 'in',
    listing: { title: 'Smart Contract Security Audit' },
    amount_fiat: 300,
    is_trade: false,
    is_private: false,
    counterparty: '0xM3n4O5p6Q7r8...S9t0',
    created_at: new Date(Date.now() - 86400000 * 9).toISOString(),
  },
  {
    id: 'dtx4',
    direction: 'out',
    listing: { title: 'Sony WH-1000XM5 Headphones' },
    amount_fiat: null,
    is_trade: true,
    is_private: false,
    counterparty: '0xA1b2C3d4E5f6...G7h8',
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    id: 'dtx5',
    direction: 'in',
    listing: { title: 'Circular Economy Workshop (3h)' },
    amount_fiat: 45,
    is_trade: false,
    is_private: false,
    counterparty: '0xQ7r8S9t0U1v2...W3x4',
    created_at: new Date(Date.now() - 86400000 * 18).toISOString(),
  },
  {
    id: 'dtx6',
    direction: 'out',
    listing: { title: 'ZK Proofs Crash Course (4h)' },
    amount_fiat: 160,
    is_trade: false,
    is_private: true,
    counterparty: '0xI9j0K1l2M3n4...O5p6',
    created_at: new Date(Date.now() - 86400000 * 25).toISOString(),
  },
  {
    id: 'dtx7',
    direction: 'in',
    listing: { title: 'Antique Leica M6 Film Camera' },
    amount_fiat: null,
    is_trade: true,
    is_private: false,
    counterparty: '0xY5z6A7b8C9d0...E1f2',
    created_at: new Date(Date.now() - 86400000 * 40).toISOString(),
  },
];
```

---

### 2.3 — `src/components/ProfilePage.jsx` — 4 mudanças

**Mudança A — Import DEMO_TRANSACTIONS:**

No topo do arquivo, adicionar nos imports de dados:
```js
import { DEMO_TRANSACTIONS } from '../data/demoProfile';
```

**Mudança B — Usar demo transactions em vez de API call:**

Localizar o `useEffect` de transações:
```js
useEffect(() => {
  if (!walletAddress) return;
  setTxLoading(true);
  fetchUserTransactions(walletAddress, 10)
    .then(setTransactions)
    .catch(() => setTransactions([]))
    .finally(() => setTxLoading(false));
}, [walletAddress]);
```

Substituir por:
```js
useEffect(() => {
  if (!walletAddress) return;
  const isDemo = !!localStorage.getItem('ipeXchange_demoSession');
  if (isDemo) {
    setTransactions(DEMO_TRANSACTIONS);
    return;
  }
  setTxLoading(true);
  fetchUserTransactions(walletAddress, 10)
    .then(setTransactions)
    .catch(() => setTransactions([]))
    .finally(() => setTxLoading(false));
}, [walletAddress]);
```

**Mudança C — Corrigir heroName para usar display_name:**

Localizar:
```js
const heroName = email ? email.split('@')[0] : shortWallet || displayName;
```

Substituir por:
```js
const heroName = xchangeUser?.display_name
  ? xchangeUser.display_name.split(' ')[0].toLowerCase()
  : email
  ? email.split('@')[0]
  : shortWallet || 'anon';
```

> Para Jean Hansen demo: exibe `jean.ipecity.eth`. Para usuário Privy com nome: primeiro nome lowercase. Para wallet-only: wallet encurtada.

**Mudança D — Adicionar seções de Badges e Web of Trust:**

Localizar o bloco `{/* ── PASSPORT CARD ── */}` (que tem os cards de Ipê Passport e ZKP Privacy). Adicionar **antes** dele os dois novos blocos:

```jsx
{/* ── BADGES ── */}
{xchangeUser?.badges?.length > 0 && (
  <div className="glass-panel" style={{ padding: '28px 32px', marginBottom: 24 }}>
    <SectionTitle icon={Award}>Badges &amp; Achievements</SectionTitle>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {xchangeUser.badges.map(badge => (
        <div key={badge.id} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderRadius: 100,
          border: `1px solid ${badge.color}40`,
          background: `${badge.color}0D`,
        }}>
          <span style={{ fontSize: 16 }}>{badge.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: badge.color }}>{badge.label}</span>
        </div>
      ))}
    </div>
  </div>
)}

{/* ── WEB OF TRUST ── */}
{xchangeUser?.web_of_trust?.length > 0 && (
  <div className="glass-panel" style={{ padding: '28px 32px', marginBottom: 24 }}>
    <SectionTitle icon={Network}>Web of Trust</SectionTitle>
    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
      Citizens you have directly traded with or vouched for.
    </p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {xchangeUser.web_of_trust.map((contact, i) => (
        <div key={contact.wallet} style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 0',
          borderBottom: i < xchangeUser.web_of_trust.length - 1 ? '1px solid var(--border-color)' : 'none',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(56,189,248,0.12)',
            border: '1px solid rgba(56,189,248,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: '#38BDF8', flexShrink: 0,
          }}>
            {contact.name.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{contact.name}</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{contact.wallet}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#B4F44A', marginBottom: 2 }}>Rep {contact.rep}</p>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{contact.relation}</p>
          </div>
        </div>
      ))}
    </div>
    <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.2)' }}>
      <p style={{ fontSize: 12, color: '#818CF8' }}>
        🔐 Your web of trust is portable — carry it to Próspera, Zuzalu, or any Ipê protocol city.
      </p>
    </div>
  </div>
)}
```

> **Nota de imports:** Se `Network` não está importado em ProfilePage, adicionar ao bloco de imports do `lucide-react`.

---

### 2.4 — `src/components/WalletPage.jsx` — Usar dados demo

**Mudança A — Adicionar import:**

No topo do arquivo, junto com os outros imports de dados:
```js
import { DEMO_PURCHASES, DEMO_LISTINGS } from '../data/demoProfile';
```

**Mudança B — Usar demo data quando em modo guest:**

Localizar (dentro do componente, provavelmente num `useEffect` ou diretamente):
```js
const purchases = getPurchases();
const listings  = getMyListings();
```

Substituir por:
```js
const isDemo    = !!localStorage.getItem('ipeXchange_demoSession');
const purchases = isDemo ? DEMO_PURCHASES : getPurchases();
const listings  = isDemo ? DEMO_LISTINGS  : getMyListings();
```

> Se `purchases` e `listings` estiverem num `useState` + `useEffect`, ajustar o `useEffect` para usar a mesma lógica (verificar `isDemo` e chamar `setX` com os dados corretos antes do return).

---

## Ordem de Execução Recomendada

```
Etapa 1 (5 min) → Etapa 2 (1 hora)
```

Dentro da Etapa 2, executar nesta ordem:
1. `src/App.jsx` — remover bloco de desvio
2. `src/data/demoProfile.js` — adicionar DEMO_TRANSACTIONS
3. `src/components/ProfilePage.jsx` — 4 mudanças (import + useEffect + heroName + badges/web-of-trust)
4. `src/components/WalletPage.jsx` — 2 mudanças (import + lógica demo)

---

## O Que NÃO Mudar

| Arquivo | Status |
|---------|--------|
| `src/lib/UserContext.jsx` | ✅ Já carrega `DEMO_USER` corretamente quando demo session |
| `src/components/ConnectAgentScreen.jsx` | ✅ Animação já funciona — apenas não era chamada |
| `src/components/SyncScreen.jsx` | ✅ Já funciona — apenas não era chamada |
| `src/data/demoProfile.js` (DEMO_USER, DEMO_LISTINGS, DEMO_PURCHASES) | ✅ Dados existentes estão corretos — só adicionar DEMO_TRANSACTIONS |
| `src/components/LoginScreen.jsx` | ✅ Botão "Enter as Guest" já seta `ipeXchange_demoSession` corretamente |

---

## Checklist de Validação

### Etapa 1 — Map
- [ ] Abrir homepage → mapa carrega com nós visíveis
- [ ] Aguardar 5 segundos → nós NÃO somem, feed lateral atualiza sem blink
- [ ] Toggle de layers funciona sem resetar o mapa

### Etapa 2 — Guest Mode
- [ ] Clicar "Enter as Guest" → chega em ConnectAgentScreen (não vai direto ao portal)
- [ ] Clicar "Connect your Agent" → animação de 3 steps (900ms cada) → SyncScreen
- [ ] SyncScreen progride 0→100% → entra no portal
- [ ] Perfil mostra `jean.ipecity.eth` (não "Anon")
- [ ] Endereço da carteira mostra `0x73a4f8b2...f5A`
- [ ] On-Chain Reputation mostra RepRing com score 99 (não "New Member" vazio)
- [ ] Badges: 5 badges (City Co-Founder, Early Trader, Top Trader, ZK Pioneer, Multi-Hop Master)
- [ ] Web of Trust: 5 conexões (Layla M., Tomás R., Sun Wei, Priya K., Carlos A.)
- [ ] Activity Summary: mostra "47 Xchanges", "12 Active Listings", "Rep Score: 99"
- [ ] Latest Transactions: mostra 7 transações (mix de in/out, trade e fiat)
- [ ] Toggle "Show all" / "Hide private" funciona (dtx6 é privada)
- [ ] WalletPage → "My Purchases" mostra 7 compras do Jean
- [ ] WalletPage → "My Listings" mostra 12 listings (9 active, 2 paused, 1 sold)
- [ ] Clicar Disconnect → volta para login screen → demo session é limpa
