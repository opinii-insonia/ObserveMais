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

Os leads do formulário são enviados por POST em JSON para a URL de
`SHEETS_WEBHOOK_URL`. Há dois caminhos possíveis — escolha um.

### Opção A — Zapier (mais simples de configurar, exige plano pago)

1. Zapier > Create Zap.
2. Trigger: **Webhooks by Zapier > Catch Hook**. Copie a URL gerada.
   Atenção: "Webhooks by Zapier" é integração Premium e não existe no plano gratuito.
3. Envie um lead de teste pelo site para o Zapier capturar o formato dos campos.
4. Action: **Google Sheets > Create Spreadsheet Row**, apontando para a planilha e
   mapeando os campos.
5. Na Vercel, crie `SHEETS_WEBHOOK_URL` com a URL do passo 2. Não precisa de
   `SHEETS_WEBHOOK_SECRET`: no Zapier quem protege é a própria URL, que é secreta.
6. Redeploy.

### Opção B — Apps Script (gratuito, configuração um pouco maior)

1. Siga o passo a passo em `scripts/planilha-leads.gs` (instalação comentada no topo).
2. Crie na Vercel as variáveis de ambiente:
   - `SHEETS_WEBHOOK_URL` — URL `/exec` do Web App.
   - `SHEETS_WEBHOOK_SECRET` — o mesmo segredo definido no script.
3. Redeploy para as variáveis valerem.

### Campos enviados

`segredo`, `id`, `recebidoEm`, `nome`, `empresa`, `cargo`, `email`, `whatsapp`,
`origem` (qual CTA abriu o formulário) e `fonte`.

O envio é considerado bem-sucedido quando a resposta traz `ok: true` (Apps Script)
ou `status: "success"` (Zapier). Qualquer outra coisa vira `sheet: "falhou"` com o
motivo no log — a captura em si nunca é derrubada por causa disso.

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
