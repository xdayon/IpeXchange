# City Graph — Crash Fix & Clean Consolidation

**Status:** Pronto para execução  
**Prioridade:** CRÍTICO — A home está quebrando em produção  
**Estimated effort:** ~1.5h  

---

## 1. Diagnóstico do Problema

A home exibe `Something went wrong loading this page` porque o `CityGraphMap.jsx` está num estado **misto/inconsistente**:

- Linha 300: `new SimEngine(...)` → `SimEngine` NÃO está mais importado (o import foi deletado para corrigir o build).
- Linha 596: `<ActivityFeed activities={activities} />` → `ActivityFeed` NÃO está importado.
- Resultado: `SimEngine is not defined` e `ActivityFeed is not defined` em runtime → **crash no React error boundary** → tela em branco.

O `HomePage.jsx` no git **voltou para a versão original** (sem `SimEngine`, sem o novo `ActivityFeed`), mas o `CityGraphMap.jsx` ficou numa versão híbrida que depende das duas coisas deletadas.

### Resumo dos estados atuais por arquivo:

| Arquivo | Estado atual | Problema |
|---------|-------------|---------|
| `CityGraphMap.jsx` | Versão híbrida com referências a `SimEngine` e `ActivityFeed` sem import | CRASH em runtime |
| `HomePage.jsx` | Versão original — funcional, mas sem integração com o novo feed | OK, mas desatualizado |
| `SimEngine.js` | Atualizado corretamente | OK |
| `ActivityFeed.jsx` (em `src/components/`) | Criado pelo plano anterior | Não está sendo usado por ninguém |
| `LayerToggle.jsx` | Atualizado corretamente com novos ícones | OK |
| `cityGraphAdapter.js` | Atualizado com 5 novos layers | OK |
| `cityGraphBuilder.js` | Atualizado com novos nós | OK |

---

## 2. Estratégia de Correção

**Filosofia:** Manter o `CityGraphMap.jsx` como componente autossuficiente — ele instancia e controla o `SimEngine` internamente, e exibe o `ActivityFeed` dentro de si mesmo. Isso é mais simples, seguro e evita o padrão frágil de prop-callback entre componentes pai/filho.

A barra de Live Activity da direita (`<aside>` no `HomePage.jsx`) continua existindo mas alimentada diretamente pelo `CityGraphMap` via contexto ou callback simples.

**Opção escolhida (mais simples e segura):**  
- `CityGraphMap.jsx` controla tudo internamente (SimEngine + feed interno).
- O `ActivityFeed` fica como um pequeno painel **dentro do mapa** (bottom-right), não como a barra lateral externa.
- A `<aside>` da `HomePage.jsx` continua com o feed de listagens reais da API (como estava no original).
- **Isso mantém o mesmo comportamento visual e correto, mas sem acoplamento frágil.**

---

## 3. Mudanças por Arquivo

### 3.1 — `src/components/CityGraph/CityGraphMap.jsx` — [MODIFY]

**O que muda:** Adicionar de volta os imports que estão faltando.

```diff
+ import { SimEngine } from './SimEngine';
+ import { ActivityFeed } from '../ActivityFeed';
```

> O arquivo `src/components/ActivityFeed.jsx` **já existe** (foi criado no plano anterior).  
> O arquivo `src/components/CityGraph/SimEngine.js` **já existe** e está atualizado.

Essa é a única mudança necessária para corrigir o crash. O resto do arquivo está correto.

---

### 3.2 — `src/components/ActivityFeed.jsx` — VERIFICAR/MANTER

O arquivo já existe em `src/components/ActivityFeed.jsx`.  
Verificar que o `export` está correto: `export function ActivityFeed({ activities }) { ... }`.

---

### 3.3 — `src/components/CityGraph/SimEngine.js` — VERIFICAR/MANTER

O arquivo já foi atualizado com os templates corretos.  
Verificar que o `export class SimEngine` está presente e correto.

---

### 3.4 — `src/components/HomePage.jsx` — MANTER COMO ESTÁ

O arquivo original está funcional. **Não modificar.** A barra lateral da direita continua carregando dados da API via `fetchDiscoverItems`. Isso já funciona e é correto.

---

## 4. Passos de Execução

1. Verificar que `src/components/ActivityFeed.jsx` existe e tem o export correto.
2. Verificar que `src/components/CityGraph/SimEngine.js` tem `export class SimEngine`.
3. **Adicionar os dois imports** no início de `CityGraphMap.jsx`.
4. Build local para confirmar que não há erros.
5. Commit e push.

---

## 5. Verificação de Build Local

```bash
cd /home/dx/Projects/Ipê\ Connect/IpeXchange
npm run build
```

O build deve completar sem erros. Resultado esperado:
```
✓ built in X.XXs
```

---

## 6. Commit

```bash
git add .
git commit -m "fix: restore SimEngine and ActivityFeed imports in CityGraphMap — fix runtime crash"
git push origin main
```

---

## 7. Checklist de Validação

- [ ] Build local passa sem erros (`npm run build`)
- [ ] HomePage carrega normalmente (sem "Something went wrong")
- [ ] City Graph Map renderiza com os 5 layers corretos
- [ ] Animações dos dots acontecem no mapa
- [ ] Live Activity barra lateral direita mostra listagens reais
- [ ] Nenhuma instância de `SimEngine is not defined` no console
- [ ] Nenhuma instância de `ActivityFeed is not defined` no console
