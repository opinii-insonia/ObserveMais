# Status

**Fase:** VERTICAL SUPERMERCADOS / implementação local da Opção A em validação
**Atualizado em:** 2026-07-31

## 2026-10-21 — Redesign no layout do modelo + diagnóstico gratuito

- [x] Home e /restaurantes refeitas no design de https://observemais.vercel.app/ (Montserrat, navy #0B1520, laranja #FF6A00), com `site.css`/`site.js` próprios.
- [x] Lacunas do modelo preenchidas com dados reais: 7 logos de clientes, 3 depoimentos (Big Box/Ultrabox, Tecnótica, Nativas), contatos, redes, vídeo do YouTube e blog. Sem percentuais inventados.
- [x] Nova landing /diagnostico-gratuito (alias /diagnostico): cadastra todos e aprova Brasília/DF com 4+ unidades, recalculado no servidor.
- [x] `npm.cmd run check` verde (36 testes) e smoke em 390/768/1440 px nas três páginas: sem overflow, sem imagem quebrada, sem erro de JS; menu, modal e as duas respostas do diagnóstico exercitados.
- [x] Rodada 2: removido todo conteúdo ilustrativo (painel com números fictícios, cases de exemplo, resultados deduzidos dos depoimentos); logos só de Big Box, Ultrabox, Nativas e Tecnótica.
- [x] Contato da home e de /restaurantes passa a ser o formulário Kommo (id 1734095) no bloco #contato; o modal próprio saiu.
- [x] /diagnostico-gratuito enxuto para tráfego de anúncio: formulário único na primeira dobra, sem menu.
- [ ] Na Kommo: trocar o campo "Empresa" (hoje é Nota/Comentário) pelo campo de Empresa, tirar a imagem lateral e os textos "Cabeçalho"/"Parágrafo", ajustar placeholders e cor do botão.
- [x] Rodada 3: WhatsApp único (+55 61 99371-5292) com a mensagem "Vim através do site da Observe+."; confirmação "Dentro de minutos, um especialista entrará em contato com você" na Kommo e no diagnóstico; logo da Mercado Malunga no mural de clientes.
- [x] Diagnóstico: corte passou para 2 unidades, cadastro exige e-mail corporativo e o critério saiu de toda a parte visível — a decisão vive só na API e o navegador apenas exibe o painel que ela indicar.
- [x] Rodada 4: /diagnostico-gratuito refeita como landing de conversão (hero → vídeo → dor → prova → relatório → para quem → oferta R$ 0,00 + formulário → compromisso → passos → FAQ → CTA final), inspirada na estrutura de cobre.metodoteia.com com identidade própria. Mockup do painel de relatório em HTML/CSS, com unidades anonimizadas.
- [x] Rodada 5: versão mobile da landing refeita como a principal. Painel do relatório empilhado até 900px (pilares viram barras deitadas, tabela vira cartão, nada girado e nada de arrastar), depoimentos em carrossel, barra de ação fixa que some no topo e no formulário, CTA apontando direto para o formulário e correção do título invisível dentro do cartão. Verificado de 320px a 1440px.
- [x] Rodada 6: landing do diagnóstico enxugada para tráfego de anúncio do Instagram. Oferta e formulário na primeira tela, 8 seções curtas (topo, faixa de clientes, dor em foto, 3 entregas com imagem, relatório, vídeo + passos, depoimentos, dúvidas, CTA), texto de leitura reduzido a ~530 palavras e página 28% mais curta no celular.
- [ ] Confirmar se podemos exibir os valores de tabela dos entregáveis (hoje a oferta mostra só o R$ 0,00, sem preço riscado).
- [ ] Ajustar o Zap para separar `tipo = diagnostico-gratuito` em aba própria.
- [ ] Publicação, somente mediante autorização explícita.

## Estado geral (rodada anterior)

- [x] Landing verticalizada para cliente oculto em supermercados.
- [x] Hero reposicionada para dor direta do dono: falhas invisíveis que custam venda.
- [x] Área central reorganizada em evidências por setor, divergências, prioridade por loja e plano de correção.
- [x] Hero próprio gerado e integrado em `public/assets/hero-score-tres-visoes-neon-observe-mais.png`.
- [x] Metadados, FAQ, schema, navegação, plataforma e rodapé sincronizados com a narrativa de supermercados.
- [x] ROI reposicionado como simulação de perda silenciosa, com nota explícita de simulação ilustrativa, sem garantia financeira.
- [x] `npm.cmd run check` verde após a verticalização, com 19 testes e build local de `dist/`.
- [x] Smoke local em 390, 768 e 1440 px após a verticalização: sem overflow horizontal; imagens carregadas; menu mobile abre/fecha; modal de lead exercitado.
- [x] Produção, DNS, credenciais e dados persistentes não foram alterados.
- [ ] Aprovação visual e editorial do usuário.
- [ ] Confirmação comercial de provas, depoimentos e métricas setoriais antes de adicionar claims fortes.
- [ ] Publicação e smoke pós-deploy, somente mediante autorização explícita.

## Ambiente web

**Progresso:** versão local e `dist/` atualizados com a Opção A de cada área.
**Validação:** contratos editoriais, schema, assets, build, menu mobile, calculadora/modal e responsividade validados nesta rodada.
**Produção:** não alterada.

## Próximo passo

Revisar visualmente a versão local e aprovar o conteúdo. Não há deploy pendente autorizado.
