# Unificação do Catálogo e Multi-Hop com Equilíbrio de Valor (IpêXchange)

## Diagnóstico do Problema

### O que está quebrado hoje:

| Contexto | Problema |
|---|---|
| **Discover** | Usa `listings` da tabela Supabase. Anúncios criados por **usuários** via chat ou form. |
| **Stores** | Catálogo **hardcoded** em `StoreDetailPage.jsx` (constante `STORE_CATALOG`). **Completamente isolado** — não existe no banco de dados. |
| **Multi-Hop Engine** | Considera apenas `listings` do banco. Produtos das Stores são **invisíveis** para o grafo de trocas. |
| **Equilíbrio de valor** | O `matchScore` é calculado por **similaridade semântica** (pgvector cosine distance), não por valor monetário. Uma bicicleta de R$850 pode ser "matched" com um pão de R$5 se as descrições forem similares semanticamente. |

---

## Solução Proposta

### Arquitetura Unificada: `unified_catalog`

```
┌─────────────────────────────────────────────────────────────┐
│                    UNIFIED CATALOG                          │
│                                                             │
│  source_type = 'user_listing'   → listings (Discover)       │
│  source_type = 'store_product'  → store products (Stores)   │
│                                                             │
│  Campos comuns:                                             │
│  - id, title, description, category                        │
│  - price_fiat (OBRIGATÓRIO para equilíbrio de valor)        │
│  - source_type, source_id, owner_session_id                 │
│  - embedding (pgvector)                                     │
│  - active                                                   │
│ └─────────────────────────────────────────────────────────────┘
```

### Estratégia em 4 Frentes

---

## Frente 1 — Banco de Dados: Tabela `stores` + `store_products`

**Problema:** As stores são hardcoded no frontend. Precisam entrar no banco.

#### [NOVO] Tabela `stores`
```sql
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  session_id TEXT,                    -- dono da store
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  address TEXT,
  on_chain BOOLEAN DEFAULT false,
  reputation_score FLOAT DEFAULT 80,
  icon_key TEXT,                      -- mapeia para ícone no frontend
  icon_color TEXT,
  is_mock BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### [NOVO] Tabela `store_products`
```sql
CREATE TABLE store_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('Product', 'Service')),
  description TEXT,
  price_fiat NUMERIC NOT NULL,          -- preço OBRIGATÓRIO para equilíbrio
  price_label TEXT,                     -- ex: "$4", "$25/week", "Upon request"
  image_url TEXT,
  payments TEXT[],                      -- ['fiat','crypto','trade','ipe']
  accepts_trade BOOLEAN DEFAULT false,
  embedding VECTOR(768),
  is_mock BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Frente 2 — Equilíbrio de Valor no Multi-Hop

**Problema:** O engine atual compara embeddings (semântica), mas ignora preços. Bicicleta (R$850) ↔ Pão (R$5) — mathematicamente "compatíveis" semanticamente se as demandas coincidirem.

### Solução: `value_balance_score`

No `find_trade_cycles`, além do `match_score` semântico, calcular um **score de equilíbrio de valor**:

```sql
-- Tolerância: até 40% de diferença de valor é aceitável
-- Exemplo: R$500 ↔ R$700 → ratio = 500/700 = 0.71 → OK
-- Exemplo: R$50 ↔ R$850 → ratio = 50/850 = 0.058 → BLOQUEADO

value_balance_score = LEAST(price_a / NULLIF(price_b, 0), price_b / NULLIF(price_a, 0))
-- Resultado entre 0 e 1. Score >= 0.6 = aceitável (até ~67% de diferença)
```

O **matchScore final** vira:
```
final_score = (semantic_score * 0.6) + (value_balance_score * 0.4)
```

Isso garante que o Multi-Hop só proponha trocas com **equilíbrio de valor razoável**.

---

## Frente 3 — Backend: Seed das Stores + API `/api/stores`

#### [MODIFICAR] `add_mock_listings.sql` ou novo `add_mock_stores.sql`
- Inserir as 10 stores atuais com seus produtos na `stores` + `store_products`
- Gerar embeddings no seed (ou ao menos `price_fiat` realistas)

#### [MODIFICAR] `server.js`
- `GET /api/stores` — lista stores (com filtro por categoria)
- `GET /api/stores/:storeId/products` — produtos de uma store
- Produtos com `accepts_trade = true` entram no grafo do Multi-Hop

#### [MODIFICAR] `supabase_schema.sql`
- Adicionar tabelas `stores` e `store_products`
- Adicionar `price_fiat` como NOT NULL em `store_products` (equilíbrio de valor)
- Modificar `find_trade_cycles` para incluir `store_products` no grafo
- Adicionar índices HNSW em `store_products.embedding`

---

## Frente 4 — Frontend: Stores conectadas ao banco

#### [MODIFICAR] `StoresPage.jsx`
- Remover `STORES` hardcoded → fetch `GET /api/stores`

#### [MODIFICAR] `StoreDetailPage.jsx`  
- Remover `STORE_CATALOG` hardcoded → fetch `GET /api/stores/:id/products`

#### [MODIFICAR] `MultiHopTradeCard.jsx`
- Exibir `value_balance_score` e `price_fiat` de cada item no ciclo
- Indicar visualmente quando há desequilíbrio de valor (badge laranja)
- Badge "Store Product" vs "User Listing" para diferenciar a origem

#### [MODIFICAR] `CircularTradePage.jsx`
- Exibir novo campo `valueDelta` (diferença de valor) em cada ciclo
- Ordenar ciclos por `final_score` (semântico + valor)

---

## Diagrama do Fluxo Unificado

```
DISCOVER          STORES
   │                 │
   │ user_listing    │ store_product
   └────────┬────────┘
            │
            ▼
    ┌──────────────┐
    │  LISTINGS    │  (tabela unificada ou VIEW)
    │  + price_fiat│
    │  + embedding │
    └──────┬───────┘
           │
           ▼
    ┌──────────────────────────────┐
    │   find_trade_cycles (SQL)    │
    │                              │
    │  semantic_score (pgvector)   │
    │  + value_balance_score       │
    │  = final_score               │
    └──────────────────────────────┘
           │
           ▼
    Multi-Hop Trade Cards
    (com preço e equilíbrio visível)
```

---

## Plano de Execução

### Fase 1 — Banco de Dados (SQL)
1. Criar `stores` e `store_products` no schema
2. Seed das 10 stores mock com produtos e `price_fiat`
3. Atualizar `find_trade_cycles` com:
   - JOIN em `store_products` além de `listings`
   - Cálculo de `value_balance_score`
   - `final_score` ponderado

### Fase 2 — Backend API
4. Adicionar funções `getStores`, `getStoreProducts` em `supabase.js`
5. Adicionar rotas `GET /api/stores` e `GET /api/stores/:id/products`

### Fase 3 — Frontend
6. `StoresPage.jsx` → fetch dinâmico
7. `StoreDetailPage.jsx` → fetch dinâmico + fallback mock
8. `MultiHopTradeCard.jsx` → exibir preços e badge de equilíbrio
9. `CircularTradePage.jsx` → ordenação por score final

---

## Questões em Aberto

> [!IMPORTANT]
> **Tolerância de valor:** Qual o range aceitável para uma troca equilibrada?
> - Proposta: até 40% de diferença (ratio >= 0.6)
> - Ex: R$500 ↔ R$800 = OK | R$50 ↔ R$850 = BLOQUEADO
> - Quer ajustar esse threshold?

> [!IMPORTANT]
> **Produtos de Store no Multi-Hop:** Devemos incluir todos os store products que têm `accepts_trade = true` no grafo de trocas? Ou apenas os que tiverem embedding gerado (semântico)?

---

## Verificação

- [ ] Stores aparecem no banco e na UI (sem hardcode)
- [ ] Produtos de stores aparecem no Discover (com badge "Store")
- [ ] Multi-Hop inclui produtos de stores nos ciclos
- [ ] Ciclos com desequilíbrio de valor (>40% diferença) são filtrados ou rebaixados no score
- [ ] `MultiHopTradeCard` exibe preço de cada item do ciclo
- [ ] Fallback mock mantém os 4 ciclos demo hardcoded intactos
