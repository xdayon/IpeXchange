# Antigravity — Manual de Instruções & Contexto

Este arquivo serve como a base de conhecimento permanente para o Antigravity (IA). Sempre que iniciar uma tarefa neste repositório, eu (Antigravity) lerei este arquivo para garantir alinhamento total.

## 🚀 Regra de Ouro (Linguagem)
- **Comunicação com o Usuário:** Português (Brasil).
- **Conteúdo do Código/Site:** 100% **INGLÊS**.
- Isso inclui: UI labels, botões, placeholders, mensagens de erro, comentários no código, logs de console e qualquer texto gerado pela IA que apareça para o usuário final.
- **NUNCA** gere código com strings em português, a menos que explicitamente solicitado para uma tradução específica.

## 📁 Contexto do Projeto: IpêXchange
- **O que é:** Marketplace de trocas (barter) para a Ipê City (uma pop-up innovation city).
- **Interface:** Voice-first, AI-native.
- **Deadline Demo:** 01/05/2026 (Quinta-feira). Foco em UX visível e fluxo de dados real.
- **Stack:** React + Vite (Frontend), Express + Gemini Flash (Backend), Supabase (DB/Vector), Privy (Auth - "Ipê Passport").

## 🛠️ Diretrizes de Desenvolvimento
- **Minimalismo:** Sem comentários óbvios. Sem abstrações desnecessárias.
- **Padrões:** Componentes em `src/components/`, API em `src/lib/api.js`, Rotas em `backend/server.js`.
- **Branding:** Use sempre "Ipê" (com acento quando em PT, mas no código/UI geralmente "Ipe" ou "Ipê" conforme o padrão existente). Não mude nomes de cidades para outros que não sejam Ipê City.
- **Segurança/Performance:** Não use placeholders. Use `generate_image` se precisar de assets.

## 📉 Otimização de Tokens & Eficiência
1. **Edições Precisas:** Use `replace_file_content` ou `multi_replace_file_content` para alterar apenas o necessário, evitando reescrever arquivos inteiros sem necessidade.
2. **Pensamento Técnico:** Meus blocos de `thought` devem ser diretos e focados na execução.
3. **Sem Redundância:** Não repetirei o que já está nos artifacts.
4. **Leitura de Contexto:** Sempre verificarei este arquivo e o `CLAUDE.md` para evitar perguntas repetitivas.

## 🧠 Memória Permanente
Se você (usuário) quiser mudar alguma regra global, edite este arquivo. Eu o considero minha "Fonte da Verdade".
