/**
 * Conteúdo do blog da Observe Mais.
 *
 * Artigos autorais. As pesquisas de terceiros entram como fonte citada e
 * linkada, nunca copiadas — conteúdo duplicado é penalizado por buscador e
 * copiar texto alheio é plágio.
 *
 * Para publicar um artigo novo: acrescente um objeto aqui e rode
 * `npm.cmd run blog`. O gerador cuida do HTML, do índice e do sitemap.
 */

export const artigos = [
  {
    slug: 'cliente-nao-reclama-so-nao-volta',
    categoria: 'Experiência do cliente',
    titulo: 'O cliente insatisfeito quase nunca reclama. Ele só não volta',
    resumo:
      'Pesquisas de mercado convergem em um número desconfortável: a esmagadora maioria dos clientes insatisfeitos vai embora sem dizer nada. Entenda o que isso significa para quem só mede reclamação.',
    data: '2026-08-26',
    leitura: '6 min',
    destaque: true,
    corpo: [
      { tipo: 'p', texto: 'Existe uma armadilha silenciosa na gestão de qualquer operação de atendimento: usar o volume de reclamações como termômetro de satisfação. A lógica parece razoável — poucas reclamações, poucos problemas. Os dados dizem o contrário.' },
      { tipo: 'h2', texto: 'O número que muda a leitura' },
      { tipo: 'p', texto: 'Um estudo conduzido por Esteban Kolsky, referência em pesquisa de experiência do cliente, aponta que <strong>91% dos clientes insatisfeitos simplesmente vão embora sem registrar qualquer reclamação</strong>. Philip Kotler, em sua obra sobre administração de marketing, chega a território parecido: a grande maioria dos consumidores muito insatisfeitos não reclama, apenas troca de fornecedor.' },
      { tipo: 'p', texto: 'Há ainda uma proporção clássica na literatura de atendimento: para cada cliente que formaliza uma reclamação, existe um grupo consideravelmente maior que viveu o mesmo problema e não disse nada.' },
      { tipo: 'destaque', texto: 'Se apenas uma fração dos insatisfeitos reclama, o número de reclamações não mede insatisfação. Mede disposição para reclamar.' },
      { tipo: 'h2', texto: 'Por que o silêncio é pior que a reclamação' },
      { tipo: 'p', texto: 'Quem reclama está, de certa forma, dando uma segunda chance. A reclamação é um pedido de reparo: o cliente ainda considera continuar. Já o silêncio não oferece nada — nem o diagnóstico do problema, nem a oportunidade de corrigir, nem o aviso de que a conta vai chegar.' },
      { tipo: 'p', texto: 'Na prática, isso cria um efeito perverso na operação. A loja ou o restaurante com poucos registros de reclamação aparece bem nos relatórios internos, enquanto perde recorrência mês a mês por motivos que ninguém nomeou.' },
      { tipo: 'h2', texto: 'O que fazer quando o dado não vem sozinho' },
      { tipo: 'p', texto: 'Se o cliente não traz o problema espontaneamente, alguém precisa ir buscá-lo. É exatamente esse o papel de um programa de cliente oculto: reproduzir a jornada real de compra ou de consumo e registrar, com critério objetivo, o que aconteceu — inclusive o que passaria despercebido por quem trabalha ali todos os dias.' },
      { tipo: 'lista', itens: [
        'A pesquisa de satisfação captura <strong>percepção</strong>: o que o cliente sentiu, quando ele responde.',
        'O checklist interno captura <strong>intenção</strong>: o padrão que a operação acredita estar entregando.',
        'A visita de cliente oculto captura <strong>execução</strong>: o que de fato aconteceu naquele turno, naquele dia.',
      ] },
      { tipo: 'p', texto: 'As três leituras raramente coincidem. E é justamente onde elas divergem que costuma estar a perda que ninguém explicou.' },
      { tipo: 'h2', texto: 'Como começar' },
      { tipo: 'p', texto: 'Não é preciso montar um programa complexo para tirar valor disso. Um roteiro objetivo, visitas recorrentes e uma reunião de devolutiva com responsável e prazo já mudam o jogo — desde que o objetivo seja corrigir o processo, não punir a equipe.' },
      { tipo: 'fontes', itens: [
        { texto: 'Consumidor Moderno — o cliente não reclama, só para de comprar', url: 'https://consumidormoderno.com.br/feedback-negativo-consumidor-seu-cliente-oculto/' },
        { texto: 'Zendesk — cliente insatisfeito: como evitar e como lidar', url: 'https://www.zendesk.com.br/blog/cliente-insatisfeito/' },
        { texto: 'UFRGS — as consequências da insatisfação dos clientes', url: 'https://lume.ufrgs.br/bitstream/handle/10183/61595/000507237.pdf?sequence=1' },
      ] },
    ],
  },

  {
    slug: 'o-que-e-cliente-oculto',
    categoria: 'Cliente oculto',
    titulo: 'O que é cliente oculto e o que ele realmente avalia',
    resumo:
      'Cliente oculto não é opinião de visitante nem fiscalização disfarçada. É uma metodologia de pesquisa com roteiro, critério objetivo e evidência. Veja como funciona na prática.',
    data: '2026-08-25',
    leitura: '7 min',
    corpo: [
      { tipo: 'p', texto: 'Cliente oculto — ou <em>mystery shopping</em> — é uma técnica de pesquisa em que um avaliador treinado vive a jornada do cliente comum, sem que a equipe saiba que está sendo observada, e registra o que encontrou seguindo um roteiro definido previamente.' },
      { tipo: 'p', texto: 'A diferença para uma simples opinião está no método: o que será observado, com que critério e em que momento é decidido antes da visita. Sem isso, o resultado vira relato pessoal — e relato pessoal não se compara entre lojas nem entre ciclos.' },
      { tipo: 'h2', texto: 'O que entra em um roteiro' },
      { tipo: 'p', texto: 'O escopo varia conforme o negócio, mas costuma cobrir três camadas:' },
      { tipo: 'lista', itens: [
        '<strong>Estrutura e ambiente</strong> — limpeza, organização, sinalização, conservação, temperatura, ruído.',
        '<strong>Execução operacional</strong> — disponibilidade de produto, preço visível e correto, validade, exposição, tempo de espera.',
        '<strong>Atendimento</strong> — abordagem, cordialidade, conhecimento do produto, condução até a solução, fechamento.',
      ] },
      { tipo: 'destaque', texto: 'Um bom roteiro responde perguntas verificáveis. "O atendimento foi bom?" não serve. "O cliente foi abordado em até 3 minutos?" serve.' },
      { tipo: 'h2', texto: 'O que a visita não resolve sozinha' },
      { tipo: 'p', texto: 'A visita mostra a execução de um momento específico. Ela não diz o que o cliente sentiu ao longo do tempo, nem o que a liderança acredita estar entregando na rotina. Por isso um programa maduro combina a visita com pesquisa de satisfação e com o checklist da operação.' },
      { tipo: 'p', texto: 'Pesquisas de mercado sobre CX reforçam esse ponto: o cliente oculto entrega mais valor quando conectado a dados de voz do cliente e a indicadores operacionais, em vez de viver isolado em um relatório próprio.' },
      { tipo: 'h2', texto: 'Frequência importa mais que profundidade' },
      { tipo: 'p', texto: 'Uma visita isolada produz uma fotografia. Visitas recorrentes produzem uma série histórica — e é a série que revela reincidência, sazonalidade e o efeito real das correções aplicadas. Uma falha que aparece uma vez pode ser acaso; a mesma falha em três ciclos seguidos é processo.' },
      { tipo: 'h2', texto: 'O erro mais comum na implantação' },
      { tipo: 'p', texto: 'Tratar o resultado como instrumento de punição. Quando a equipe entende o programa como armadilha, o efeito colateral é imediato: a operação passa a tentar identificar o avaliador em vez de melhorar o padrão. O objetivo precisa estar claro desde o começo — medir o processo para dar suporte a quem executa.' },
      { tipo: 'fontes', itens: [
        { texto: 'Ipsos — designing a smarter mystery shopping program', url: 'https://www.ipsos.com/en-us/knowledge/customer-experience/designing-smarter-mystery-shopping-program' },
        { texto: 'Intouch Insight — mystery shopping in market research', url: 'https://www.intouchinsight.com/blog/mystery-shopping-in-market-research/' },
      ] },
    ],
  },

  {
    slug: 'ruptura-de-gondola-quanto-custa',
    categoria: 'Supermercados',
    titulo: 'Ruptura de gôndola: o que os números do varejo brasileiro mostram',
    resumo:
      'Produto em falta na gôndola é uma das maiores causas de venda perdida no varejo alimentar — e boa parte do cliente que não encontra simplesmente compra no concorrente. Os dados do setor.',
    data: '2026-08-24',
    leitura: '6 min',
    corpo: [
      { tipo: 'p', texto: 'Ruptura é o produto que deveria estar disponível para o cliente e não está. Parece um problema de estoque, mas boa parte dela nasce na operação de loja: reposição atrasada, produto no depósito sem chegar à gôndola, etiqueta trocada, frente vazia em horário de pico.' },
      { tipo: 'h2', texto: 'O tamanho do problema' },
      { tipo: 'p', texto: 'Levantamentos setoriais colocam a ruptura média brasileira em uma faixa consistentemente acima da média global. A Pesquisa Abrappe de Perdas no Varejo Brasileiro, na edição de 2025, registrou ruptura comercial em torno de 7,8% e ruptura operacional em torno de 5,1% — ambas em alta na comparação com o levantamento anterior.' },
      { tipo: 'p', texto: 'Dados atribuídos à ABRAS apontam ainda que uma parcela expressiva das perdas de venda no setor tem origem na falta de produto na gôndola, e que uma fatia relevante dos clientes que não encontram o item <strong>compra no concorrente</strong> em vez de substituir dentro da própria loja.' },
      { tipo: 'destaque', texto: 'A ruptura não custa só a venda daquele item. Custa a cesta inteira, quando o cliente decide resolver a compra em outro lugar.' },
      { tipo: 'h2', texto: 'Por que o sistema não enxerga tudo' },
      { tipo: 'p', texto: 'O estoque no sistema pode indicar disponibilidade enquanto a gôndola está vazia. Isso acontece por divergência de inventário, produto retido no depósito, avaria não baixada ou reposição fora de hora. É a chamada <em>ruptura operacional</em> — invisível no relatório e visível para o cliente.' },
      { tipo: 'p', texto: 'É aqui que a observação em loja tem valor difícil de substituir: alguém precisa olhar a gôndola no horário em que o cliente olha.' },
      { tipo: 'h2', texto: 'O que medir além do percentual' },
      { tipo: 'lista', itens: [
        '<strong>Reincidência por item</strong> — o mesmo SKU falhando em ciclos seguidos indica processo, não acaso.',
        '<strong>Horário e turno</strong> — ruptura concentrada em pico revela dimensionamento de reposição.',
        '<strong>Etiqueta e preço</strong> — produto presente sem preço visível gera o mesmo abandono da falta.',
        '<strong>Comparação entre lojas</strong> — a mesma rede com desempenhos distintos aponta prática replicável.',
      ] },
      { tipo: 'p', texto: 'Estimativas de mercado sugerem que cada ponto percentual de redução de ruptura tem impacto direto e relevante sobre o faturamento. Mesmo tratando esses números como referência, e não como promessa, a direção é clara: medir a gôndola pela ótica do cliente costuma pagar o esforço.' },
      { tipo: 'fontes', itens: [
        { texto: 'KPMG / Abrappe — Pesquisa de Perdas no Varejo Brasileiro 2025', url: 'https://kpmg.com/br/pt/insights/2026/01/pesquisa-abrappe.html' },
        { texto: 'Abrappe — ruptura nos supermercados: como controlar e vender mais', url: 'https://www.abrappe.com.br/noticia?id=ruptura-nos-supermercados%3A-veja-como-controlar-e-vender-mais' },
        { texto: 'ABEPRO — análise da ruptura de produtos nas gôndolas supermercadistas', url: 'https://abepro.org.br/biblioteca/enegep2010_tn_sto_113_741_16716.pdf' },
      ] },
    ],
  },

  {
    slug: 'nps-checklist-e-visita-tres-visoes',
    categoria: 'Metodologia',
    titulo: 'NPS, checklist e visita: por que uma fonte só engana',
    resumo:
      'Cada instrumento de medição responde a uma pergunta diferente. Quando você usa apenas um, a resposta parece completa — e não é. O valor está na divergência entre eles.',
    data: '2026-08-22',
    leitura: '7 min',
    corpo: [
      { tipo: 'p', texto: 'Toda operação de atendimento mede alguma coisa. O problema raramente é ausência de dado — é dado de uma fonte só, interpretado como se fosse o retrato completo.' },
      { tipo: 'h2', texto: 'Três perguntas diferentes' },
      { tipo: 'p', texto: 'Vale separar o que cada instrumento realmente responde:' },
      { tipo: 'lista', itens: [
        '<strong>NPS e pesquisa de satisfação</strong> respondem "o que o cliente sentiu". Alta sensibilidade, viés de quem se dispõe a responder.',
        '<strong>Checklist da liderança</strong> responde "o que a operação acredita ter executado". Cobertura ampla, viés de autoavaliação.',
        '<strong>Visita de cliente oculto</strong> responde "o que aconteceu naquele momento". Critério objetivo, recorte pontual.',
      ] },
      { tipo: 'p', texto: 'Nenhuma das três é dispensável, e nenhuma é suficiente. O checklist com 100% de conformidade convive perfeitamente com um NPS ruim. E o cliente oculto pode registrar uma falha que a pesquisa nunca capturou, porque ninguém respondeu naquele dia.' },
      { tipo: 'destaque', texto: 'Quando o checklist diz conforme, o avaliador registra falha e o cliente responde nota baixa, a divergência não é erro de medição. É o ponto exato onde a operação está perdendo cliente sem saber.' },
      { tipo: 'h2', texto: 'O que a divergência revela' },
      { tipo: 'p', texto: 'Alguns padrões se repetem quando as três leituras são colocadas lado a lado:' },
      { tipo: 'lista', itens: [
        '<strong>Checklist alto, visita baixa</strong> — o padrão existe no papel mas não chega ao turno. Costuma indicar falta de tempo, de gente ou de clareza.',
        '<strong>Visita alta, NPS baixo</strong> — a execução está correta, mas o que foi definido como padrão não é o que importa para o cliente.',
        '<strong>NPS alto, visita baixa</strong> — a base atual tolera a falha, o que costuma mascarar dificuldade de atrair cliente novo.',
      ] },
      { tipo: 'h2', texto: 'Como cruzar sem virar planilha eterna' },
      { tipo: 'p', texto: 'O cruzamento só é útil se produzir uma decisão. Na prática, isso significa converter as três fontes em uma leitura comparável entre unidades e ciclos, e usar essa leitura para escolher onde agir primeiro — não para gerar mais um relatório.' },
      { tipo: 'p', texto: 'É esse o papel do índice que a Observe Mais chama de IOV, o Índice de Operação Viva: reunir execução observada, percepção do cliente e leitura da liderança em um único número comparável, com a prioridade do ciclo explicitada.' },
      { tipo: 'fontes', itens: [
        { texto: 'Intouch Insight — como mystery shopping, pesquisa e reputação se complementam', url: 'https://www.intouchinsight.com/blog/transforming-cx-how-mystery-shopping-feedback-survey-and-reputation-management-work-together' },
        { texto: 'Confero — customer satisfaction surveys vs. mystery shops', url: 'https://www.conferoinc.com/head-to-head-customer-satisfaction-surveys-vs-mystery-shops/' },
      ] },
    ],
  },

  {
    slug: 'implantar-cliente-oculto-sem-caca-as-bruxas',
    categoria: 'Gestão',
    titulo: 'Como implantar cliente oculto sem virar caça às bruxas',
    resumo:
      'O maior risco de um programa de cliente oculto não é o custo nem a logística. É a equipe entender o projeto como armadilha e passar a trabalhar contra ele.',
    data: '2026-08-20',
    leitura: '5 min',
    corpo: [
      { tipo: 'p', texto: 'Programas de cliente oculto falham por dois motivos principais. O primeiro é técnico: roteiro vago, que produz opinião em vez de evidência. O segundo é cultural, e costuma ser mais caro — a equipe passa a enxergar o programa como fiscalização pessoal.' },
      { tipo: 'h2', texto: 'O sintoma de que deu errado' },
      { tipo: 'p', texto: 'Quando a operação começa a tentar identificar o avaliador, o programa já perdeu a função. A energia que deveria ir para o padrão vai para adivinhar quem é o visitante — e o resultado das visitas deixa de representar o dia comum.' },
      { tipo: 'destaque', texto: 'A visita mede o processo, não a pessoa. Se a devolutiva vira busca por culpado, a próxima visita já não mede nada real.' },
      { tipo: 'h2', texto: 'Quatro decisões que mudam o resultado' },
      { tipo: 'lista', itens: [
        '<strong>Anuncie o programa, não a visita.</strong> A equipe deve saber que existem avaliações recorrentes. O que não se anuncia é a data.',
        '<strong>Comece pelo diagnóstico, não pela meta.</strong> Definir meta antes de conhecer a linha de base transforma o primeiro ciclo em fracasso anunciado.',
        '<strong>Devolutiva com responsável e prazo.</strong> Relatório sem reunião de correção é documento; com reunião, vira rotina de melhoria.',
        '<strong>Reconheça o que subiu.</strong> Um programa que só aponta falha perde adesão no terceiro ciclo.',
      ] },
      { tipo: 'h2', texto: 'O papel da liderança local' },
      { tipo: 'p', texto: 'Gerentes de unidade precisam receber o resultado antes de qualquer cobrança corporativa e ter espaço para contextualizar. Muitas falhas apontadas em visita têm causa fora do alcance da equipe: escala apertada, ruptura de fornecedor, equipamento parado. Tratar tudo como desempenho individual desperdiça a informação mais útil do relatório.' },
      { tipo: 'h2', texto: 'O que medir no próprio programa' },
      { tipo: 'p', texto: 'Vale acompanhar não só o resultado das lojas, mas a saúde do programa: quantas ações de correção foram efetivamente concluídas, quanto tempo levaram e quantas falhas reincidiram depois de tratadas. Um programa saudável reduz reincidência ciclo a ciclo. Um programa apenas fiscalizador estabiliza — e depois é abandonado.' },
      { tipo: 'fontes', itens: [
        { texto: 'Ipsos — designing a smarter mystery shopping program', url: 'https://www.ipsos.com/en-us/knowledge/customer-experience/designing-smarter-mystery-shopping-program' },
        { texto: 'Renascence — mystery shopping as customer experience research', url: 'https://www.renascence.io/journal/mystery-shopping-is-a-form-of-customer-experience-research' },
      ] },
    ],
  },

  {
    slug: 'experiencia-do-cliente-em-restaurantes',
    categoria: 'Restaurantes',
    titulo: 'Experiência do cliente em restaurante: o que não aparece no faturamento',
    resumo:
      'A casa cheia esconde falhas que só vão aparecer meses depois, quando a recorrência cai. Os pontos de atrito que passam despercebidos em salão e cozinha.',
    data: '2026-08-18',
    leitura: '6 min',
    corpo: [
      { tipo: 'p', texto: 'Restaurante é um dos negócios em que o intervalo entre a falha e a consequência é mais longo. O cliente insatisfeito paga a conta, agradece, vai embora — e a perda só aparece semanas depois, na forma de uma mesa que não voltou a ser reservada.' },
      { tipo: 'h2', texto: 'Os atritos que raramente viram reclamação' },
      { tipo: 'lista', itens: [
        '<strong>Espera sem informação.</strong> O problema costuma ser menos o tempo e mais a ausência de aviso sobre ele.',
        '<strong>Item indisponível no cardápio.</strong> Descobrir na hora do pedido reposiciona toda a expectativa da refeição.',
        '<strong>Prato fora da temperatura.</strong> Poucos clientes devolvem; a maioria come e não comenta.',
        '<strong>Garçom que não retorna à mesa.</strong> Impede o pedido adicional e, com ele, o aumento natural do ticket.',
        '<strong>Banheiro malcuidado.</strong> Afeta desproporcionalmente a percepção de higiene da cozinha, que o cliente não vê.',
        '<strong>Demora na conta.</strong> É o último contato e costuma ser o mais lembrado.',
      ] },
      { tipo: 'destaque', texto: 'Nenhum desses pontos aparece no faturamento do dia. Todos aparecem na decisão do próximo jantar.' },
      { tipo: 'h2', texto: 'Por que a avaliação online não basta' },
      { tipo: 'p', texto: 'Avaliações públicas são úteis, mas chegam tarde e com viés forte: concentram experiências extremas, positivas ou negativas. O cliente medianamente insatisfeito — aquele que representa a maior fatia da perda — costuma não avaliar. Ele apenas deixa de escolher a casa.' },
      { tipo: 'h2', texto: 'O que uma visita estruturada acrescenta' },
      { tipo: 'p', texto: 'Uma visita com roteiro registra a linha do tempo da refeição com hora e critério: quanto tempo até a abordagem, quanto tempo entre pedido e entrega, se o prato saiu no padrão, se houve retorno à mesa, como foi o fechamento. Isso transforma impressão em série histórica, e série histórica permite comparar turnos, dias e unidades.' },
      { tipo: 'p', texto: 'A pergunta que interessa deixa de ser "o atendimento está bom?" e passa a ser "em que turno o tempo de saída da cozinha sai do padrão, e há quantos ciclos isso vem se repetindo?".' },
      { tipo: 'fontes', itens: [
        { texto: 'Instituto Experiência do Cliente — quando o cliente não reclama', url: 'https://www.institutoexperienciadocliente.com/post/o-cliente-n%C3%A3o-fala-ele-s%C3%B3-n%C3%A3o-volta' },
        { texto: 'Harmo — como as reclamações podem ajudar a fidelizar clientes', url: 'https://harmo.me/blog/reclamacoes-para-fidelizar-clientes' },
      ] },
    ],
  },
];
