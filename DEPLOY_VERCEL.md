# Deploy — Vercel

## Antes de publicar

1. Executar `npm.cmd run check`.
2. Confirmar que o projeto Vercel está conectado ao repositório GitHub `opinii-insonia/ObserveMais`,
   branch padrão `codex/vercel-roi-calculator`.
3. Confirmar que `vercel.json` usa `buildCommand: npm run build` e `outputDirectory: dist`.
4. Criar/conectar um Blob Store privado ao projeto para persistir leads.
5. Criar a variável de ambiente `ROI_LEADS_TOKEN` na Vercel.

## Publicação

- Push em branch de PR cria Deploy Preview.
- Push na branch padrão (`codex/vercel-roi-calculator`) publica produção, se o projeto Vercel
  estiver conectado a ela. Não existe branch `main` neste repositório.

## Planilha do Google

Os leads do formulário do site também vão para a planilha, via Web App do Apps Script.

1. Siga o passo a passo em `scripts/planilha-leads.gs` (instalação comentada no topo).
2. Crie na Vercel as variáveis de ambiente:
   - `SHEETS_WEBHOOK_URL` — URL `/exec` do Web App.
   - `SHEETS_WEBHOOK_SECRET` — o mesmo segredo definido no script.
3. Redeploy para as variáveis valerem.

Sem `SHEETS_WEBHOOK_URL` a captura continua funcionando: o lead vai para o Blob e a
resposta traz `sheet: "nao_configurado"`. Se a planilha falhar, vem `sheet: "falhou"`
e o erro aparece nos logs — a captura nunca é derrubada por causa da planilha.

## Página interna do simulador

O simulador de ROI não está na landing. Ele responde em
`/simulador-interno-a7f39c2b.html`, com `noindex` e fora do menu e do sitemap.

**Isto não é controle de acesso.** É um caminho difícil de adivinhar: quem tiver o link
entra. Não trate como confidencial. Para proteção real, o caminho é o mesmo de
`leads-export.js` — função serverless exigindo token.

## Leads

Os leads são capturados por `api/lead-capture.js` e gravados no Vercel Blob quando o Blob Store estiver conectado ao projeto.

Exportação protegida:

- Tabela no navegador: `https://observemais.com.br/api/leads-export?token=SEU_TOKEN`
- CSV: `https://observemais.com.br/api/leads-export?format=csv&token=SEU_TOKEN`
- JSON: `https://observemais.com.br/api/leads-export?format=json&token=SEU_TOKEN`

`SEU_TOKEN` é o valor da variável de ambiente `ROI_LEADS_TOKEN`.

## Pós-deploy

- Testar HTTPS em `https://observemais.com.br`.
- Testar menu mobile, FAQ, calculadora ROI e CTAs de WhatsApp.
- Fazer uma simulação de ROI e confirmar exportação em CSV.
