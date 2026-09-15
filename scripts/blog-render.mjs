/**
 * Renderização compartilhada do blog.
 *
 * Usada por scripts/gerar-blog.mjs (artigos versionados, gerados no build) e por
 * api/artigo.js (artigos publicados pelo painel, renderizados sob demanda). Manter
 * um só renderizador é o que garante que os dois caminhos produzam a mesma página.
 */
const SITE = 'https://observemais.com.br';
const raiz = new URL('../blog/', import.meta.url);

export const escapar = (texto) =>
  String(texto).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// O resumo vai para meta description e para o card; a marcação inline do corpo
// não pode vazar para lá.
export const semTags = (texto) => String(texto).replace(/<[^>]+>/g, '');

export const dataLonga = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

const EDITOR_TAG = [
  '',
  '    <script src="/blog-editor.js" defer></script>',
].join(String.fromCharCode(10));

function cabecalho({ titulo, descricao, url, canonical, imagem }) {
  const incluiEditor = url === '/blog';
  const cartao = imagem || `${SITE}/public/assets/og-observe-mais-tres-visoes.jpg`;
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escapar(descricao)}" />
    <meta name="theme-color" content="#25D670" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
    <meta name="author" content="Observe Mais" />
    <link rel="canonical" href="${canonical}" />

    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/public/assets/apple-touch-icon.png" />

    <meta property="og:site_name" content="Observe Mais" />
    <meta property="og:locale" content="pt_BR" />
    <meta property="og:title" content="${escapar(titulo)}" />
    <meta property="og:description" content="${escapar(descricao)}" />
    <meta property="og:image" content="${cartao}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Observe Mais — cliente oculto, NPS e checklist da liderança formando o IOV" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapar(titulo)}" />
    <meta name="twitter:description" content="${escapar(descricao)}" />
    <meta name="twitter:image" content="${cartao}" />

    <title>${escapar(titulo)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/styles.css" />
    <script src="/script.js" defer></script>${incluiEditor ? EDITOR_TAG : ''}`;
}

function navegacao() {
  return `  <body>
    <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>

    <header class="site-header" id="topo">
      <div class="container header-inner">
        <a class="brand" href="/" aria-label="Observe Mais — página inicial">
          <img class="brand-logo" src="/public/assets/logo-observe-plus-light-web.png" alt="Observe Mais" width="440" height="87" />
        </a>

        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-navigation" aria-label="Abrir menu">
          <span></span><span></span><span></span>
        </button>

        <nav id="main-navigation" class="main-nav" aria-label="Navegação principal">
          <a href="/">Supermercados</a>
          <a href="/restaurantes">Restaurantes</a>
          <a href="/blog" aria-current="page">Blog</a>
          <button class="nav-postar" type="button" data-abrir-editor>Fazer uma postagem</button>
        </nav>

        <a class="button button-primary header-blog" href="/blog">Blog</a>
        <button class="button button-dark header-cta" type="button" data-lead-flow>Agendar diagnóstico</button>
      </div>
    </header>`;
}

function rodape() {
  return `    <footer class="site-footer">
      <div class="container footer-grid">
        <div class="footer-brand"><img class="footer-logo" src="/public/assets/logo-observe-plus-dark-web.png" alt="Observe Mais" width="440" height="87" loading="lazy" /><p>Cliente oculto com <span class="ia">IA</span> • NPS, checklist e visita na mesma leitura • prioridades que viram ação.</p></div>
        <div><strong>Verticais</strong><a href="/">Supermercados</a><a href="/restaurantes">Restaurantes</a></div>
        <div><strong>Conteúdo</strong><a href="/blog">Blog</a><a href="/#faq">FAQ</a></div>
        <div id="contato"><strong>Contato</strong><a href="mailto:contato@observemais.com.br">contato@observemais.com.br</a><a href="https://wa.me/5561993715292" target="_blank" rel="noopener noreferrer">WhatsApp</a><a href="https://www.instagram.com/observall" target="_blank" rel="noopener noreferrer">Instagram</a><a href="https://www.youtube.com/@Observall" target="_blank" rel="noopener noreferrer">YouTube</a></div>
      </div>
      <div class="container footer-bottom"><span>© <span id="current-year">2026</span> Observe Mais. Todos os direitos reservados.</span><a href="#topo">Voltar ao topo ↑</a></div>
    </footer>

    <a class="whatsapp-float" href="https://wa.me/5561999555580?text=Ol%C3%A1%2C%20vim%20pelo%20blog%20da%20Observe%20Mais." target="_blank" rel="noopener noreferrer" aria-label="Conversar com a Observe Mais no WhatsApp" title="WhatsApp: +55 61 99955-5580">
      <svg class="whatsapp-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <path d="M16.01 3.2A12.63 12.63 0 0 0 5.1 22.2L3.5 28.8l6.76-1.58a12.62 12.62 0 0 0 5.75 1.38h.01A12.7 12.7 0 0 0 28.8 15.95 12.73 12.73 0 0 0 16.01 3.2Zm0 22.98h-.01a10.24 10.24 0 0 1-5.2-1.42l-.38-.23-4.02.94.96-3.92-.25-.4A10.2 10.2 0 1 1 26.38 16 10.36 10.36 0 0 1 16.01 26.18Zm5.6-7.63c-.31-.15-1.82-.9-2.1-1-.28-.11-.48-.15-.69.15-.2.31-.79 1-.97 1.2-.18.2-.36.23-.67.08-.31-.15-1.3-.48-2.48-1.53a9.3 9.3 0 0 1-1.72-2.14c-.18-.31-.02-.48.14-.63.14-.14.31-.36.46-.54.15-.18.2-.31.31-.51.1-.2.05-.38-.03-.54-.08-.15-.69-1.66-.94-2.27-.25-.6-.5-.52-.69-.53h-.59c-.2 0-.54.08-.82.38-.28.31-1.07 1.05-1.07 2.56s1.1 2.97 1.25 3.17c.15.2 2.16 3.3 5.24 4.63.73.32 1.3.51 1.75.65.74.23 1.41.2 1.94.12.59-.09 1.82-.74 2.08-1.45.26-.72.26-1.33.18-1.45-.08-.13-.28-.2-.59-.34Z" />
      </svg>
    </a>

    ${formularioLead()}
  </body>
</html>
`;
}

function formularioLead() {
  const etapas = [
    ['email', 'Qual é o seu e-mail?', 'email', 'voce@empresa.com.br', 'email'],
    ['whatsapp', 'Qual é o seu WhatsApp?', 'tel', '(61) 99999-9999', 'tel'],
    ['nome', 'Como podemos te chamar?', 'text', 'Seu nome completo', 'name'],
    ['empresa', 'Qual é a sua empresa?', 'text', 'Nome da empresa', 'organization'],
    ['cargo', 'Qual é o seu cargo?', 'text', 'Proprietário, diretor, gerente…', 'organization-title'],
  ];

  const campos = etapas
    .map(([nome, rotulo, tipo, placeholder, autocomplete], i) => `          <div class="lead-step${i === 0 ? ' is-active' : ''}" data-step="${nome}">
            <label for="flow-${nome}">${rotulo}</label>
            <input id="flow-${nome}" name="${nome}" type="${tipo}" autocomplete="${autocomplete}" placeholder="${placeholder}" />
          </div>`)
    .join('\n\n');

  return `<div class="lead-flow" id="lead-flow" role="dialog" aria-modal="true" aria-labelledby="lead-flow-title" hidden>
      <div class="lead-flow__backdrop" data-flow-close></div>

      <div class="lead-flow__card">
        <button class="lead-flow__close" type="button" data-flow-close aria-label="Fechar formulário">×</button>

        <header class="lead-flow__head">
          <img src="/public/assets/logo-observe-plus-light-web.png" alt="Observe Mais" width="440" height="87" />
          <div class="lead-flow__progress" role="progressbar" aria-valuemin="1" aria-valuemax="5" aria-valuenow="1" aria-label="Progresso do formulário">
            <i data-flow-bar></i>
          </div>
        </header>

        <form class="lead-flow__body" id="lead-flow-form" novalidate>
          <p class="lead-flow__intro">Precisamos de algumas informações para preparar o diagnóstico certo para a sua operação.</p>

${campos}

          <p class="lead-flow__error" id="lead-flow-error" role="alert" hidden></p>

          <div class="lead-flow__actions">
            <button class="lead-flow__back" type="button" data-flow-back hidden>← Voltar</button>
            <button class="button button-primary lead-flow__next" type="submit" data-flow-next>Confirmar →</button>
          </div>

          <p class="lead-flow__legal">Ao confirmar, você aceita ser contatado pela equipe Observe Mais sobre o diagnóstico. Seus dados não são compartilhados com terceiros.</p>
        </form>

        <div class="lead-flow__done" id="lead-flow-done" hidden>
          <span class="lead-flow__check" aria-hidden="true">✓</span>
          <h2>Recebemos seus dados.</h2>
          <p>Nossa equipe vai retomar o contato para alinhar objetivo, unidades e roteiro do diagnóstico.</p>
          <a class="button button-primary" id="lead-flow-whatsapp" href="https://wa.me/5561993715292?text=Ol%C3%A1%2C%20preenchi%20o%20formul%C3%A1rio%20no%20blog%20e%20quero%20agendar%20um%20diagn%C3%B3stico." target="_blank" rel="noopener noreferrer">Adiantar pelo WhatsApp</a>
          <button class="lead-flow__back" type="button" data-flow-close>Fechar</button>
        </div>

        <h2 id="lead-flow-title" class="visually-hidden">Agendar diagnóstico</h2>
      </div>
    </div>`;
}

function corpoDoArtigo(blocos) {
  return blocos
    .map((bloco) => {
      if (bloco.tipo === 'h2') return `        <h2>${bloco.texto}</h2>`;
      if (bloco.tipo === 'p') return `        <p>${bloco.texto}</p>`;
      if (bloco.tipo === 'destaque') return `        <blockquote class="post-destaque">${bloco.texto}</blockquote>`;
      if (bloco.tipo === 'lista') {
        return `        <ul class="post-lista">\n${bloco.itens.map((i) => `          <li>${i}</li>`).join('\n')}\n        </ul>`;
      }
      if (bloco.tipo === 'imagem') {
        return `        <figure class="post-figura">
          <img src="${bloco.url}" alt="${bloco.alt}" loading="lazy" />
${bloco.legenda ? `          <figcaption>${bloco.legenda}</figcaption>
` : ''}        </figure>`;
      }
      if (bloco.tipo === 'fontes') {
        return `        <aside class="post-fontes">
          <h2>Fontes consultadas</h2>
          <ul>
${bloco.itens.map((f) => `            <li><a href="${f.url}" target="_blank" rel="noopener noreferrer nofollow">${f.texto}</a></li>`).join('\n')}
          </ul>
          <p>Este texto é autoral. As pesquisas acima foram consultadas como referência e estão linkadas para verificação.</p>
        </aside>`;
      }
      return '';
    })
    .join('\n\n');
}

export function paginaArtigo(artigo, relacionados) {
  const canonical = `${SITE}/blog/${artigo.slug}`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: artigo.titulo,
    description: semTags(artigo.resumo),
    datePublished: artigo.data,
    inLanguage: 'pt-BR',
    mainEntityOfPage: canonical,
    author: { '@type': 'Organization', name: 'Observe Mais', url: `${SITE}/` },
    publisher: {
      '@type': 'Organization',
      name: 'Observe Mais',
      logo: { '@type': 'ImageObject', url: `${SITE}/public/assets/logo-observe-plus-light-web.png` },
    },
  };

  return `${cabecalho({ titulo: `${artigo.titulo} | Blog Observe Mais`, descricao: semTags(artigo.resumo), url: `/blog/${artigo.slug}`, canonical, imagem: artigo.capa })}

    <script type="application/ld+json">
${JSON.stringify(schema, null, 6).replace(/^/gm, '      ')}
    </script>
  </head>
${navegacao()}

    <main id="conteudo">
      <article class="post">
        <header class="post-head container">
          <nav class="post-migalhas" aria-label="Você está aqui">
            <a href="/blog">Blog</a> <span aria-hidden="true">/</span> <span>${artigo.categoria}</span>
          </nav>
          <h1>${artigo.titulo}</h1>
          <p class="post-resumo">${artigo.resumo}</p>
          <p class="post-meta"><time datetime="${artigo.data}">${dataLonga(artigo.data)}</time> <span aria-hidden="true">•</span> ${artigo.leitura} de leitura</p>
        </header>

${artigo.capa ? `        <figure class="post-capa container">
          <img src="${artigo.capa}" alt="${escapar(artigo.capaAlt || artigo.titulo)}" />
        </figure>
` : ''}        <div class="post-corpo container">
${corpoDoArtigo(artigo.corpo)}
        </div>

        <div class="container post-cta">
          <h2>Quer saber o que a sua operação perde sem ouvir reclamação?</h2>
          <p>Agende um diagnóstico e receba a leitura das três visões na sua unidade.</p>
          <button class="button button-primary" type="button" data-lead-flow>Agendar diagnóstico</button>
        </div>

        ${relacionados.length ? `<aside class="container post-relacionados" aria-labelledby="relacionados-title">
          <h2 id="relacionados-title">Leia também</h2>
          <div class="post-grid">
${relacionados.map(cartao).join('\n')}
          </div>
        </aside>` : ''}
      </article>
    </main>

${rodape()}`;
}

export function cartao(artigo) {
  const capa = artigo.capa
    ? `
              <a class="post-card__capa" href="/blog/${artigo.slug}" tabindex="-1" aria-hidden="true"><img src="${escapar(artigo.capa)}" alt="" loading="lazy" /></a>`
    : '';

  return `            <article class="post-card${artigo.capa ? ' post-card--com-capa' : ''}" data-busca="${escapar(`${semTags(artigo.titulo)} ${semTags(artigo.resumo)} ${artigo.categoria}`.toLowerCase())}">${capa}
              <span class="post-card__tag">${artigo.categoria}</span>
              <h3><a href="/blog/${artigo.slug}">${artigo.titulo}</a></h3>
              <p>${artigo.resumo}</p>
              <footer><time datetime="${artigo.data}">${dataLonga(artigo.data)}</time> <span aria-hidden="true">•</span> ${artigo.leitura}</footer>
            </article>`;
}

function modalEditor() {
  return `<div class="editor-modal" id="editor-modal" role="dialog" aria-modal="true" aria-labelledby="editor-titulo" hidden>
        <div class="editor-modal__fundo" data-editor-fechar></div>

        <div class="editor-modal__card">
          <button class="lead-flow__close" type="button" data-editor-fechar aria-label="Fechar">×</button>
          <h2 id="editor-titulo">Publicar no blog</h2>

          <div data-editor-login>
            <p class="admin-ajuda">Acesso restrito.</p>
            <form data-form-login novalidate>
              <label for="ed-senha">Senha</label>
              <input id="ed-senha" type="password" autocomplete="current-password" placeholder="••••••••" />
              <p class="admin-erro" data-erro-login role="alert" hidden></p>
              <button class="button button-primary" type="submit">Entrar</button>
            </form>
          </div>

          <div data-editor-form hidden>
            <form data-form-artigo novalidate>
              <label for="ed-titulo">Título</label>
              <input id="ed-titulo" type="text" placeholder="Ex.: O que medir na primeira visita" />

              <label for="ed-categoria">Categoria</label>
              <input id="ed-categoria" type="text" list="ed-categorias" placeholder="Cliente oculto" />
              <datalist id="ed-categorias">
                <option value="Cliente oculto"></option>
                <option value="Experiência do cliente"></option>
                <option value="Supermercados"></option>
                <option value="Restaurantes"></option>
                <option value="Metodologia"></option>
                <option value="Gestão"></option>
              </datalist>

              <label for="ed-resumo">Resumo <small>aparece no cartão e no Google</small></label>
              <textarea id="ed-resumo" rows="3" placeholder="Duas ou três linhas sobre o que o leitor ganha."></textarea>

              <label for="ed-capa">Imagem de capa <small>vira o cartão e a prévia ao compartilhar — até 2 MB</small></label>
              <input id="ed-capa" type="file" accept="image/jpeg,image/png,image/webp" />
              <p class="admin-ajuda" data-capa-status></p>
              <img class="editor-capa" data-capa-preview alt="Prévia da capa" hidden />

              <label for="ed-corpo">Conteúdo</label>
              <p class="admin-ajuda">
                <code>## </code> subtítulo &nbsp;·&nbsp; <code>- </code> lista &nbsp;·&nbsp;
                <code>&gt; </code> destaque &nbsp;·&nbsp; <code>**negrito**</code> &nbsp;·&nbsp;
                linha em branco separa parágrafo
              </p>
              <textarea id="ed-corpo" rows="14" placeholder="Escreva aqui…"></textarea>

              <label for="ed-imagem">Inserir imagem no texto</label>
              <input id="ed-imagem" type="file" accept="image/jpeg,image/png,image/webp" />
              <p class="admin-ajuda" data-imagem-status></p>

              <p class="admin-erro" data-erro-artigo role="alert" hidden></p>
              <p class="admin-ok" data-ok-artigo role="status" hidden></p>

              <div class="admin-acoes">
                <button class="button button-primary" type="submit" data-publicar>Publicar</button>
                <button class="lead-flow__back" type="button" data-editor-fechar>Fechar</button>
              </div>
            </form>

            <section class="editor-lista" aria-labelledby="editor-lista-titulo">
              <h3 id="editor-lista-titulo">Artigos no ar</h3>
              <div data-lista-artigos><p class="admin-ajuda">Carregando…</p></div>
            </section>
          </div>
        </div>
      </div>`;
}

export function paginaIndice(lista) {
  const canonical = `${SITE}/blog`;
  const descricao =
    'Conteúdo autoral sobre cliente oculto, experiência do cliente e execução de loja: o que medir, como cruzar as fontes e o que fazer com a evidência.';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Blog Observe Mais',
    url: canonical,
    inLanguage: 'pt-BR',
    publisher: { '@type': 'Organization', name: 'Observe Mais', url: `${SITE}/` },
    blogPost: lista.map((a) => ({
      '@type': 'BlogPosting',
      headline: a.titulo,
      url: `${SITE}/blog/${a.slug}`,
      datePublished: a.data,
    })),
  };

  return `${cabecalho({ titulo: 'Blog | Observe Mais', descricao, url: '/blog', canonical })}

    <script type="application/ld+json">
${JSON.stringify(schema, null, 6).replace(/^/gm, '      ')}
    </script>
  </head>
${navegacao()}

    <main id="conteudo">
      <section class="blog-hero" aria-labelledby="blog-title">
        <div class="container">
          <h1 id="blog-title">Evidência de loja, não achismo de corredor.</h1>
          <p>Conteúdo autoral sobre cliente oculto, experiência do cliente e execução de operação — o que medir, como cruzar as fontes e o que fazer com o que aparece.</p>
        </div>
      </section>

      <div class="container blog-busca">
        <label class="visually-hidden" for="blog-search">Pesquisar por artigos</label>
        <input id="blog-search" type="search" placeholder="Pesquisar por artigos…" autocomplete="off" data-blog-busca />
        <p class="blog-busca__vazio" data-blog-vazio hidden>Nenhum artigo encontrado para essa busca.</p>
      </div>

      <div class="container post-grid" data-blog-lista>
${lista.map(cartao).join('\n')}
      </div>

      ${modalEditor()}
    </main>

${rodape()}`;
}
