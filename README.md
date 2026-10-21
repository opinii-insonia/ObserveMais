# Observe Mais — site institucional

Landing page estática, responsiva e preparada para deploy na Vercel, com comunicação direcionada a cliente oculto para supermercados.

## Comandos

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

O build final é criado em `dist/`. O deploy da Vercel usa `vercel.json`, roda `npm run build` e publica `dist/`.

## Estrutura

- `index.html`: home Observe+ (layout do modelo observemais.vercel.app, com dados reais da Observe+).
- `restaurantes/index.html`: vertical de restaurantes no mesmo layout (`/restaurante` redireciona para cá).
- `diagnostico-gratuito/index.html`: produto isca — visita de cliente oculto + relatório gratuitos (`/diagnostico` redireciona para cá).
- `site.css` / `site.js`: visual e interações das três landings (menu, carrossel, vídeo, formulários e envio para a planilha).
- `styles.css` / `script.js`: visual e interações do blog, do painel e do simulador interno.
- `public/assets/`: imagens próprias recuperadas do site atual.
- `api/`: funções serverless da Vercel para captura/exportação de leads.
- `test/`: testes de contrato da landing page.
- `scripts/`: build e servidor local sem dependências externas.
