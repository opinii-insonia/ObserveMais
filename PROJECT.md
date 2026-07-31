# Projeto Observe Mais

## Objetivo

Apresentar a Observe Mais como uma solução de cliente oculto para supermercados: visitas orientadas por roteiro revelam fila, ruptura percebida, preço ausente, validade, limpeza, atendimento e exposição antes que o cliente escolha o concorrente.

## Produto

- Público: donos de supermercados, diretores de redes regionais e gestores de operação de loja.
- Conversão principal: conversa comercial via WhatsApp e captura de lead na simulação de perda silenciosa.
- Paleta: `#25D670`, `#000000`, `#FFFFFF`.
- A calculadora é uma simulação ilustrativa; não representa garantia comercial.
- O diagnóstico não publica fórmula, pesos, ROI garantido ou disponibilidade operacional sem confirmação do produto.

## Arquitetura

A interface é uma landing estática em `index.html`, `styles.css` e `script.js`. O build gera `dist/` a partir dessas fontes e de `public/assets/`. Há funções serverless em `api/` para capturar leads e exportá-los; quando configuradas no ambiente de hospedagem, usam Vercel Blob privado e o segredo server-side `ROI_LEADS_TOKEN`.

O desenho técnico derivado do código está em `ARCHITECTURE.md`.

## Estado de entrega

- A verticalização para supermercados com a Opção A de cada área foi implementada localmente em 2026-07-31.
- Produção, DNS e credenciais não foram acessados nem alterados.
- O artefato `dist/` foi regenerado localmente; publicação exige `@CRED` e confirmação explícita.

## Lacunas

- Aprovação visual e editorial do responsável pela Observe Mais.
- Provas comerciais, depoimentos e métricas setoriais só devem entrar com autorização/fonte.
- Configuração confirmada do Blob Store privado e de `ROI_LEADS_TOKEN` no ambiente de hospedagem.
- Smoke pós-publicação e confirmação de SSL, somente após autorização de deploy.
