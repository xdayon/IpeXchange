# IpêXchange — Login Logo Alignment + Artizen Haus no Mapa

**Escopo:** 2 correções cirúrgicas e independentes. Nenhuma mudança de schema, nenhuma nova dependência, nenhum risco de regressão.

---

## Fix 1 — Login Screen: Centralizar o símbolo do Ipê Passport

### Diagnóstico

**Arquivo:** `src/components/LoginScreen.jsx`

O problema está em duas camadas:

**Camada A — Ícone fingerprint (80×80)**

```jsx
// Linha 26-56
<div className="icon-wrapper" style={{ padding: 0, background: 'transparent', border: 'none', boxShadow: 'none' }}>
  <div style={{
    width: 80, height: 80, borderRadius: 20,
    // ← sem margin: 'auto'
    ...
  }}>
```

O CSS de `.icon-wrapper` tem apenas `margin-bottom: 24px`. A `div` interna de 80×80 é um elemento `block` e não tem `margin: '0 auto'`. Como o pai (`login-container`) tem `text-align: center` mas NÃO tem `display: flex`, o `text-align: center` não centraliza filhos block — apenas conteúdo inline. Resultado: o ícone fica encostado à esquerda (ou deslocado dependendo do navegador).

**Camada B — Título `<h1 className="hero-title">`**

```jsx
// Linha 57-60
<h1 className="hero-title">
  <img src="/logo.png" style={{ ..., verticalAlign: 'middle', marginRight: '10px' }} />
  <span>Ipê<span className="text-gradient-lime">Xchange</span></span>
</h1>
```

O CSS de `.hero-title` é apenas:
```css
.hero-title { font-size: 48px; margin-bottom: 16px; line-height: 1.1; }
```

Sem `display: flex` nem `justify-content: center`. O `text-align: center` herdado do `login-container` centra conteúdo inline, mas com o `img` inline e o `span` ao lado, o resultado visual não é perfeitamente centrado — o `img` (logo.png) está com `marginRight: 10px` e `verticalAlign: middle`, criando um bloco visual deslocado.

### Solução

**Passo 1 — Centralizar o ícone fingerprint:**

Adicionar `margin: '0 auto'` ao div 80×80 interno:

```jsx
// LoginScreen.jsx, linha 27-32 (substituição do div interno)
<div style={{
  width: 80, height: 80, borderRadius: 20,
  margin: '0 auto',                     // ← adicionar esta linha
  background: 'linear-gradient(145deg, #080C14 0%, #0B1421 35%, #0d1f2d 65%, #0a1a1a 100%)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 0 0 1px rgba(56,189,248,0.35), 0 0 24px rgba(56,189,248,0.15), 0 8px 32px rgba(0,0,0,0.6)',
  position: 'relative', overflow: 'hidden',
}}>
```

**Passo 2 — Centralizar o h1 com logo + texto:**

Adicionar `display: 'flex'`, `alignItems: 'center'`, `justifyContent: 'center'` ao `<h1>`:

```jsx
// LoginScreen.jsx, linha 57-60 (substituição do h1)
<h1 className="hero-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
  <img src="/logo.png" alt="IpêXchange" style={{ height: '36px', width: '36px', borderRadius: '8px', marginRight: '10px', flexShrink: 0 }} />
  <span>Ipê<span className="text-gradient-lime">Xchange</span></span>
</h1>
```

Mudanças na img:
- Remover `verticalAlign: 'middle'` (desnecessário com `display: flex` + `alignItems: 'center'`)
- Adicionar `flexShrink: 0` para o logo não comprimir em viewports estreitas

### Resultado esperado

```
          ┌──────────────────────────────────────┐
          │                                      │
          │         [  ☛ fingerprint  ]          │  ← centrado
          │                                      │
          │     [logo] IpêXchange                 │  ← logo + texto centrados juntos
          │   Connect your identity...           │
          │                                      │
          │    [ Connect Ipê Passport ]          │
          │              OR                      │
          │    🚀 Enter as Guest (Demo Mode)     │
          └──────────────────────────────────────┘
```

### Arquivos alterados

| Arquivo | Linhas | Mudança |
|---------|--------|---------|
| `src/components/LoginScreen.jsx` | 27–32 | Adicionar `margin: '0 auto'` ao div 80×80 |
| `src/components/LoginScreen.jsx` | 57–60 | Adicionar `display: flex` + `justifyContent: center` ao h1 |

---

## Fix 2 — Mapa: Adicionar Artizen Haus como venue

### Diagnóstico

**O dado já existe.** `backend/lib/cityGraphBuilder.js` linha 187 define a Artizen Haus com coordenadas e conexões completas:

```javascript
{ 
  id: 'venue-artizen-haus', 
  layer: 'commerce', 
  label: 'Artizen Haus', 
  description: 'ZK, cryptography and regenerative design hub. Smart contract audits, security research and bio-design workshops.', 
  location: { lat: -27.44166, lon: -48.50434 }, 
  kind: 'venue' 
}
```

A Artizen Haus já tem:
- Conexão `e-marina-artizen` (citizen-marina → venue-artizen-haus, Practitioner)
- Conexão `e-founder-artizen` (venue-founder-haus → venue-artizen-haus, Sister Venue)

**O problema:** `CityGraphMap.jsx` linha 18 define quais IDs recebem o marcador especial gold (venue marker):

```javascript
const VENUE_IDS = new Set(['venue-founder-haus', 'venue-ai-haus', 'venue-privacy-haus']);
```

`venue-artizen-haus` está ausente. Pior: `venue-privacy-haus` está listado mas NÃO existe no `cityGraphBuilder.js` — é um ID fantasma que nunca aparece no mapa de qualquer forma.

### Solução

**Arquivo:** `src/components/CityGraph/CityGraphMap.jsx`, linha 18

Substituir `venue-privacy-haus` (fantasma, nunca usado) por `venue-artizen-haus`:

```javascript
// Antes (linha 18)
const VENUE_IDS = new Set(['venue-founder-haus', 'venue-ai-haus', 'venue-privacy-haus']);

// Depois
const VENUE_IDS = new Set(['venue-founder-haus', 'venue-ai-haus', 'venue-artizen-haus']);
```

Só isso. O dado já existe na API, as conexões já existem no builder, a lógica de renderização do marker já suporta venues secundários (o `isVenue` path em `markerHtml()`). A Artizen Haus vai aparecer com o marcador gold secundário (10px dot, glow gold, label flutuando acima), exatamente como o AI Haus.

### Posição no mapa

Artizen Haus: `lat: -27.44166, lon: -48.50434`

Para referência:
- Founder Haus (main): `lat: -27.43890, lon: -48.49985`
- AI Haus: `lat: -27.43747, lon: -48.50342`
- Artizen Haus (nova): `lat: -27.44166, lon: -48.50434`

As três formam um triângulo no bairro de Jurerê Internacional, espaçadas organicamente — sem sobreposição de markers.

### Arquivos alterados

| Arquivo | Linha | Mudança |
|---------|-------|---------|
| `src/components/CityGraph/CityGraphMap.jsx` | 18 | Substituir `venue-privacy-haus` por `venue-artizen-haus` no Set |

---

## Ordem de execução

1. **Fix 1** — `LoginScreen.jsx`: 2 edições inline (5 min)
2. **Fix 2** — `CityGraphMap.jsx`: 1 palavra substituída (1 min)
3. Build local → verificar visual no browser
4. Commit + push

## Verificação

- [ ] Fingerprint icon centrado no card de login em desktop e mobile
- [ ] Logo.png + "IpêXchange" text alinhados centralmente no mesmo eixo que o fingerprint
- [ ] Artizen Haus aparece no mapa com marker gold (igual ao AI Haus)
- [ ] Label "Artizen Haus" aparece flutuando acima do marker
- [ ] Clicar no marker Artizen Haus abre o EntityDetailPanel com descrição e conexões
- [ ] Conexão sister-venue com Founder Haus aparece como edge animado no mapa
- [ ] AI Haus e Founder Haus continuam aparecendo normalmente (nenhuma regressão)
- [ ] Login flow completo funciona após as mudanças (Privy + Guest mode)
