# Regras do projeto Observe Mais

A fonte de governança é [`.codex/AGENTS.md`](.codex/AGENTS.md).

- Raiz geral: este diretório.
- Aplicação: landing page estática em `index.html`, `styles.css` e `script.js`.
- Assets próprios: `public/assets/`.
- Artefato de hospedagem: `dist/`, gerado por `npm.cmd run build`.
- Não publicar, alterar DNS ou acessar produção sem `@CRED` e confirmação explícita.
- Toda mudança de comportamento deve manter `npm.cmd run check` verde e receber smoke responsivo.
