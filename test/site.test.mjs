import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');

test('a landing fala diretamente com supermercados e cliente oculto', async () => {
  const html = await read('index.html');

  assert.match(html, /Cliente oculto para supermercados com IA/i);
  assert.match(html, /Seu supermercado perde vendas em falhas que ninguém da equipe está vendo/i);
  assert.match(html, /fila, ruptura percebida, preço ausente, validade, limpeza e atendimento/i);
  assert.match(html, /Evidências por setor viram[\s\S]*prioridade por loja/i);
  assert.match(html, /Cliente oculto com roteiro, evidência e[\s\S]*reunião de priorização/i);
  assert.match(html, /Dúvidas Frequentes/i);
  assert.match(html, /wa\.me\/5561993715292/);
});

test('comunica a IA como diferencial, com leitura de dados e entrega no WhatsApp', async () => {
  const html = await read('index.html');

  assert.match(html, /class="hero-ai"/);
  assert.match(html, /entrega o insight no seu WhatsApp/i);
  assert.match(html, /lê o volume de dados que ninguém tem tempo de ler/i);
  assert.match(html, /interpreta e prioriza\. A visita em loja continua sendo feita por avaliadores humanos\./);
  assert.doesNotMatch(html, /IA substitui|IA garante|diagnóstico automático sem visita/i);
});

test('toda menção a IA recebe o destaque em gradiente', async () => {
  const [html, css] = await Promise.all([read('index.html'), read('styles.css')]);

  assert.match(css, /\.ia\s*\{[^}]*color:\s*var\(--ia-solid\)/s, 'precisa de cor de fallback antes do gradiente');
  assert.match(css, /background-clip:\s*text/);
  assert.match(css, /\.ia-mark\s*\{[^}]*var\(--ia-gradient\)/s);
  assert.match(css, /\.site-footer \.ia\s*\{/, 'fundo escuro precisa de gradiente próprio');

  // O gradiente é roxo -> azul; não pode voltar a puxar para o verde da marca.
  assert.match(css, /--ia-gradient:\s*linear-gradient\([^)]*#7C3AED[^)]*#2E9BF5/i);
  assert.doesNotMatch(css, /--ia-gradient[^;]*#0FA958/i);

  // Nenhuma menção textual a IA pode ficar sem o destaque.
  const body = html.slice(html.indexOf('<body>')).replace(/<script[\s\S]*?<\/script>/g, '');
  const plain = body.replace(/<span[^>]*class="[^"]*\bia(?:-mark)?\b[^"]*"[^>]*>[\s\S]*?<\/span>/g, '');
  const leftovers = [...plain.matchAll(/>[^<>]*\b(IA|intelig[êe]ncia artificial)\b/gi)].map((m) => m[0].trim());

  assert.deepEqual(leftovers, [], `menções a IA sem destaque: ${leftovers.join(' | ')}`);
});

test('o Score da Loja aparece como mockup próprio das três visões', async () => {
  const [html, css] = await Promise.all([read('index.html'), read('styles.css')]);

  assert.match(html, /class="score360 reveal"/);
  assert.match(html, /O que o auditor vê/);
  assert.match(html, /O que o cliente fala/);
  assert.match(html, /O que a liderança reporta/);
  assert.match(html, /Boa execução, mas baixa percepção do cliente/);
  assert.match(html, /class="solutions-divergence reveal"/);
  assert.match(css, /\.score360\s*\{/);

  // Substitui a imagem antiga e não pode citar cliente real.
  assert.doesNotMatch(html, /diagnostico-tres-visoes-supermercado-v1\.png/);
  const mock = html.match(/<figure class="score360[\s\S]*?<\/figure>/)?.[0];
  assert.ok(mock, 'o mockup do Score deveria existir');
  for (const brand of ['big box', 'ultrabox', 'ultra box', 'observe+']) {
    assert.ok(!mock.toLowerCase().includes(brand), `o mockup não deveria citar "${brand}"`);
  }
});

test('padroniza o CTA de conversão, sem barra flutuante', async () => {
  const [html, css, js] = await Promise.all([read('index.html'), read('styles.css'), read('script.js')]);
  const ctaLabels = [...html.matchAll(/>([^<>]*Agendar diagnóstico[^<>]*)</g)].map((match) => match[1].trim());

  assert.ok(ctaLabels.length >= 6, `esperava ao menos 6 CTAs padronizados, achei ${ctaLabels.length}`);

  assert.doesNotMatch(html, /Quero diagnosticar minha loja/i);
  assert.doesNotMatch(html, /Encontrar perdas silenciosas da loja/i);
  assert.doesNotMatch(html, /Conhecer resultados em supermercados/i);

  // A barra flutuante foi removida: o único elemento fixo é o botão do WhatsApp.
  for (const source of [html, css, js]) {
    assert.doesNotMatch(source, /cta-dock/);
  }
  assert.match(html, /class="whatsapp-float"/);
});

test('responde por que Observe Mais logo depois da hero', async () => {
  const [html, css] = await Promise.all([read('index.html'), read('styles.css')]);

  // O bloco precisa ser a primeira seção depois da hero: é a resposta que sustenta a página.
  const sections = [...html.matchAll(/<section[^>]*\b(?:class="[^"]*"|id="[^"]*")[^>]*>/g)].map((m) => m[0]);
  assert.match(sections[0], /class="hero"/);
  assert.match(sections[1], /id="diferenciais"/);
  assert.match(html, /Cliente oculto sozinho mostra um lado\. <span>Nós mostramos os três\.<\/span>/);
  assert.match(html, /Por que Observe Mais e não outra empresa de cliente oculto\?/i);
  assert.match(html, /NPS e pesquisa/);
  assert.match(html, /Checklist da operação/);
  assert.match(html, /Visita de cliente oculto/);
  assert.match(html, /class="gap-callout[^"]*"/);
  assert.match(css, /\.views-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3/s);
});

test('modela três visões que viram prioridade e deixa a IA depois do diagnóstico', async () => {
  const html = await read('index.html');
  const modules = [...html.matchAll(/<article[^>]+data-score-module="([^"]+)"/g)].map((match) => match[1]);
  const flowSteps = [...html.matchAll(/data-score-step="([^"]+)"/g)].map((match) => match[1]);

  assert.deepEqual(modules, ['auditor-profissional', 'cliente-real', 'operacao-interna']);
  assert.deepEqual(flowSteps, ['tres-visoes', 'cruzamento', 'score', 'plano-de-acao']);
  assert.match(html, /Evidências por setor/);
  assert.match(html, /Divergências/);
  assert.match(html, /Prioridade por loja/);
  assert.match(html, /Plano de correção/);
  assert.match(html, /class="score-ai[^"]*"[\s\S]*Inteligência Artificial/i);
  assert.doesNotMatch(html, /data-score-module="ia"/i);
});

test('mantém SEO on-page alinhado à vertical sem prometer ranking', async () => {
  const html = await read('index.html');

  assert.match(html, /<title>Cliente oculto para supermercados com IA \| Observe Mais<\/title>/);
  assert.match(html, /name="description"[\s\S]*Cliente oculto para supermercados com IA/);
  assert.match(html, /property="og:image"/);
  assert.match(html, /property="og:title" content="Observe Mais — Cliente oculto para supermercados com IA"/);
  assert.doesNotMatch(html, /primeira posição|ranking garantido|tráfego garantido/i);
});

test('entrega favicon, canonical e cartão de compartilhamento completos', async () => {
  const html = await read('index.html');

  assert.match(html, /<link rel="canonical" href="https:\/\/observemais\.com\.br\/" \/>/);
  assert.match(html, /<link rel="icon" href="\/favicon\.svg" type="image\/svg\+xml" \/>/);
  assert.match(html, /<link rel="apple-touch-icon"/);
  assert.match(html, /name="robots" content="index, follow/);

  for (const tag of ['og:site_name', 'og:locale', 'og:type', 'og:url', 'og:title', 'og:description', 'og:image', 'og:image:width', 'og:image:height', 'og:image:alt']) {
    assert.match(html, new RegExp(`property="${tag}"`), `faltou ${tag}`);
  }

  for (const tag of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
    assert.match(html, new RegExp(`name="${tag}"`), `faltou ${tag}`);
  }

  assert.match(html, /name="twitter:card" content="summary_large_image"/);

  // og:image e canonical precisam ser absolutos: crawler não resolve caminho relativo.
  const absolute = [...html.matchAll(/(?:property="og:image"|name="twitter:image"|rel="canonical")[^>]*?(?:content|href)="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(absolute.length >= 3);
  for (const url of absolute) {
    assert.match(url, /^https:\/\/observemais\.com\.br\//, `URL de compartilhamento não absoluta: ${url}`);
  }
});

test('publica favicon, robots e sitemap na raiz do build', async () => {
  const build = await read('scripts/build.mjs');

  for (const file of ['favicon.svg', 'robots.txt', 'sitemap.xml']) {
    await access(new URL(`../${file}`, import.meta.url));
    assert.match(build, new RegExp(`'${file.replace('.', '\\.')}'`), `${file} não é copiado para dist/`);
  }

  const [robots, sitemap] = await Promise.all([read('robots.txt'), read('sitemap.xml')]);
  assert.match(robots, /Sitemap: https:\/\/observemais\.com\.br\/sitemap\.xml/);
  assert.match(robots, /Disallow: \/api\//);
  assert.match(sitemap, /<loc>https:\/\/observemais\.com\.br\/<\/loc>/);
});

test('usa dados estruturados somente para conteúdo visível real', async () => {
  const html = await read('index.html');
  const jsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
  const organization = jsonLd.find((item) => item['@type'] === 'Organization');
  const faq = jsonLd.find((item) => item['@type'] === 'FAQPage');

  // O texto visível pode conter marcação inline (ex.: <span class="ia">); o contrato é o
  // conteúdo, não as tags. Por isso comparamos contra o HTML sem marcação.
  const visible = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, '');

  assert.equal(organization.name, 'Observe Mais');
  assert.ok(faq.mainEntity.length >= 5);

  for (const item of faq.mainEntity) {
    assert.ok(visible.includes(item.name), `pergunta ausente do conteúdo visível: ${item.name}`);
    assert.ok(
      visible.includes(item.acceptedAnswer.text.slice(0, 44)),
      `resposta ausente do conteúdo visível: ${item.name}`,
    );
  }
});

test('mantém linguagem segura para simulação de perda silenciosa', async () => {
  const [html, css, js] = await Promise.all([read('index.html'), read('styles.css'), read('script.js')]);
  const productSource = `${html}\n${css}\n${js}`;

  assert.doesNotMatch(productSource, /Alpine/i);
  assert.doesNotMatch(html, /fórmula do Score|peso(?:s)? do Score/i);
  assert.match(html, /simulação ilustrativa/i);
  assert.match(html, /Não representa garantia de venda, lucro, ROI ou payback/i);
  assert.match(html, /Simule o tamanho da <span>perda silenciosa da sua loja\.<\/span>/i);
  assert.doesNotMatch(html, /ROI garantido|aumento de vendas garantido|lucro garantido/i);
});

test('usa a identidade Observe Mais no header e rodapé', async () => {
  const html = await read('index.html');

  assert.match(html, /Observe Mais/);
  assert.match(html, /class="brand-logo"[\s\S]*?logo-observe-plus-light\.png[\s\S]*?alt="Observe Mais"/);
  assert.match(html, /class="footer-logo"[\s\S]*?logo-observe-plus-dark\.png[\s\S]*?alt="Observe Mais"/);
  assert.doesNotMatch(html, /class="brand-wordmark"/);
  assert.doesNotMatch(html, /alt="Observall"/);
});

test('não incorpora marca, URLs ou copies específicas da referência de terceiros', async () => {
  const source = `${await read('index.html')}\n${await read('styles.css')}\n${await read('script.js')}`;

  assert.doesNotMatch(source, /seuclienteoculto/i);
  assert.doesNotMatch(source, /Seu Cliente Oculto/);
  assert.doesNotMatch(source, /maior e melhor empresa/i);
  assert.doesNotMatch(source, /América Latina/i);
  assert.doesNotMatch(source, /SCO Experience/i);
  assert.doesNotMatch(source, /Mídia e parceiros/i);
});

test('preserva a sequência de seções comerciais', async () => {
  const html = await read('index.html');

  const order = [
    'class="hero"',
    'id="diferenciais"',
    'class="metrics-strip"',
    'class="section value-section"',
    'id="solucoes"',
    'id="plataforma"',
    'id="clientes"',
    'id="depoimentos"',
    'id="sobre"',
    'id="resultados"',
    'id="faq"',
    'class="section final-cta-section"',
  ];

  let previous = -1;
  for (const marker of order) {
    const current = html.indexOf(marker);
    assert.ok(current > previous, `${marker} deveria aparecer depois da seção anterior`);
    previous = current;
  }
});

test('substitui métricas numéricas soltas por evidências de supermercado', async () => {
  const [html, css] = await Promise.all([read('index.html'), read('styles.css')]);

  for (const icon of ['icon-store', 'icon-receipt', 'icon-card', 'icon-pie-chart', 'icon-eye', 'icon-coins', 'icon-trend', 'icon-clock', 'icon-chart', 'icon-wallet']) {
    assert.match(html, new RegExp(`id="${icon}"`));
  }

  assert.match(html, /Corredores/);
  assert.match(html, /Checkout/);
  assert.match(html, /Atendimento/);
  assert.match(html, /Preço, ruptura percebida e exposição/);
  assert.doesNotMatch(html, /69,6%/);
  assert.doesNotMatch(html, /\+22 mil/);
  assert.doesNotMatch(html, /\+3 mil/);
  assert.match(css, /\.metrics-grid h3\s*\{[^}]*color:\s*var\(--green\)/s);
  assert.match(css, /\.field-icon,\s*\.result-icon\s*\{[^}]*stroke:\s*currentColor/s);
});

test('incorpora o vídeo enviado na área de método', async () => {
  const [html, videoJs] = await Promise.all([read('index.html'), read('video.js')]);

  assert.match(html, /class="about-video reveal" data-youtube-video="yuGAr_NQis8"/);
  assert.match(html, /public\/assets\/generated-supermercado\/metodo-auditor-supermercado-v1\.png/);
  assert.match(html, /Reproduzir vídeo/);
  assert.match(videoJs, /youtube-nocookie\.com\/embed/);
  assert.match(videoJs, /replaceChildren\(iframe\)/);
  assert.match(videoJs, /window\.location\.protocol === 'file:'/);
});

test('implementa calculadora com captura de lead antes do resultado', async () => {
  const [html, js] = await Promise.all([read('index.html'), read('script.js')]);

  for (const id of ['stores', 'coupons', 'ticket', 'margin', 'visits']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }

  for (const id of ['lead-name', 'lead-company', 'lead-whatsapp', 'lead-email']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }

  assert.match(html, /class="calculator-layout reveal"/);
  assert.match(html, /id="lead-modal"/);
  assert.match(html, /Simular perda silenciosa/);
  assert.match(html, /Ver meu resultado/);
  assert.match(js, /observallVisitPrice:\s*300/);
  assert.match(js, /couponGrowth:\s*0\.1/);
  assert.match(js, /ticketGrowth:\s*0\.12/);
  assert.match(js, /\/api\/lead-capture/);
  assert.doesNotMatch(js, /lead-capture\.php/);
  assert.match(js, /Preencha todos os campos para calcular seu potencial de ganho/);
});

test('o endpoint local de leads responde pela rota Vercel', async () => {
  const port = 45000 + Math.floor(Math.random() * 1000);
  const cwd = new URL('../', import.meta.url);

  const server = spawn(process.execPath, ['scripts/serve.mjs'], {
    cwd,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('servidor local não iniciou a tempo')), 7000);
    server.stdout.on('data', (chunk) => {
      if (String(chunk).includes(`http://127.0.0.1:${port}`)) {
        clearTimeout(timer);
        resolve();
      }
    });
    server.once('error', reject);
    server.once('exit', (code) => {
      if (code !== null) reject(new Error(`servidor local encerrou com código ${code}`));
    });
  });

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/lead-capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead: {
          nome: 'Lead Teste',
          empresa: 'Empresa Teste',
          whatsapp: '+55 61 99999-9999',
          email: 'lead@example.com',
        },
        simulation: {
          quantidadeDeLojas: 12,
          receitaExtraMensal: 222720,
          roiAnual: 1137.3333333333333,
        },
      }),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, storage: 'local-dev' });
  } finally {
    server.kill();
  }
});

test('o build e as APIs usam somente o fluxo Vercel', async () => {
  const [build, api, exportApi, gitignore, packageJson, readme, deployGuide] = await Promise.all([
    read('scripts/build.mjs'),
    read('api/lead-capture.js'),
    read('api/leads-export.js'),
    read('.gitignore'),
    read('package.json'),
    read('README.md'),
    read('DEPLOY_VERCEL.md'),
  ]);

  assert.doesNotMatch(build, /lead-capture\.php/);
  assert.doesNotMatch(build, /storage/);
  assert.match(api, /@vercel\/blob/);
  assert.match(api, /roi-leads\//);
  assert.match(exportApi, /ROI_LEADS_TOKEN/);
  assert.match(exportApi, /format.*csv/s);
  assert.match(exportApi, /format.*json/s);
  assert.match(exportApi, /text\/html/);
  assert.match(exportApi, /roi-leads\//);
  assert.match(packageJson, /"@vercel\/blob"/);
  assert.doesNotMatch(gitignore, /storage\/\*\.jsonl/);
  assert.match(readme, /deploy na Vercel/i);
  assert.match(deployGuide, /Deploy — Vercel/);
});

test('a página continua semântica, acessível e responsiva', async () => {
  const [html, css] = await Promise.all([read('index.html'), read('styles.css')]);

  assert.match(html, /<header[\s>]/);
  assert.match(html, /<main[\s>]/);
  assert.match(html, /<footer[\s>]/);
  assert.match(html, /aria-label="Navegação principal"/);
  assert.match(html, /<details/);
  assert.match(css, /@media\s*\(max-width:\s*720px\)/);
  assert.match(css, /:focus-visible/);
});

test('usa assets próprios com nomes alinhados a Observe Mais', async () => {
  const html = await read('index.html');

  for (const asset of [
    'public/assets/generated-supermercado/prova-reuniao-supermercado-v1.png',
    'public/assets/generated-supermercado/depoimento-relatorio-supermercado-v1.png',
    'public/assets/generated-supermercado/metodo-auditor-supermercado-v1.png',
    'public/assets/generated-supermercado/simulacao-perda-silenciosa-supermercado-v1.png',
  ]) {
    assert.match(html, new RegExp(asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    await access(new URL(`../${asset}`, import.meta.url));
  }

  await access(new URL('../public/assets/generated-supermercado/cta-supermercado-operacao-v1.png', import.meta.url));
});

test('as evidências de topo usam fotos reais de operação, não ilustração', async () => {
  const html = await read('index.html');

  for (const photo of [
    'public/assets/reais/ruptura-gondola.png',
    'public/assets/reais/corredor-desorganizado.png',
    'public/assets/reais/fila-checkout.png',
  ]) {
    assert.match(html, new RegExp(photo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    await access(new URL(`../${photo}`, import.meta.url));
  }

  // Hero, evidências e perda silenciosa não podem voltar para a ilustração gerada.
  // Caminho completo: "perda-silenciosa" é substring de "simulacao-perda-silenciosa",
  // que segue em uso legítimo na calculadora.
  for (const generated of [
    'public/assets/generated-supermercado/hero-supermercado-cliente-oculto-v1.png',
    'public/assets/generated-supermercado/evidencias-checklist-supermercado-v1.png',
    'public/assets/generated-supermercado/perda-silenciosa-supermercado-v1.png',
  ]) {
    assert.doesNotMatch(html, new RegExp(generated.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  // Nomes de arquivo precisam ser seguros em URL: sem acento, espaço ou maiúscula.
  const sources = [...html.matchAll(/src="(public\/assets\/[^"]+)"/g)].map((m) => m[1]);
  for (const source of sources) {
    assert.match(source, /^[a-z0-9/_.-]+$/, `caminho de asset inseguro para URL: ${source}`);
  }
});

test('exibe prova social voltada a supermercados', async () => {
  const [html, css, js] = await Promise.all([read('index.html'), read('styles.css'), read('script.js')]);

  assert.match(html, /id="clientes"/);
  assert.match(html, /Supermercados que usam evidência para <span>proteger padrão de loja\.<\/span>/);
  assert.match(html, /aria-label="Logos de clientes"/);

  for (const logo of ['bigbox', 'ultrabox']) {
    assert.match(html, new RegExp(`public/assets/clients/${logo}\\.png`));
  }

  for (const logo of ['goldko', 'derela', 'nativas', 'tecnotica', 'lojas-mel']) {
    assert.doesNotMatch(html, new RegExp(`public/assets/clients/${logo}\\.png`));
  }

  assert.match(css, /\.client-wall\s*\{/);
  assert.doesNotMatch(css, /@keyframes\s+logo-marquee/);
  assert.doesNotMatch(js, /moveClientCarousel/);
});

test('mantém apenas o depoimento de supermercado, em destaque', async () => {
  const [html, css] = await Promise.all([read('index.html'), read('styles.css')]);
  const cards = [...html.matchAll(/class="testimonial-card[^"]*"/g)];

  assert.match(html, /class="testimonials-section"/);
  assert.equal(cards.length, 1);
  assert.match(html, /Bruna Reges/);
  assert.match(html, /Big Box e Ultrabox/);
  assert.match(html, /Encontramos falhas de execução que não apareciam nos indicadores internos/);
  assert.doesNotMatch(html, /Marcus/);
  assert.doesNotMatch(html, /Márcia Matos/);
  assert.match(css, /\.testimonials-section\s*\{[^}]*grid-template-columns:\s*1fr/s);
});

test('o relatório é um mockup próprio, sem nome de cliente e sem dado real', async () => {
  const [html, css] = await Promise.all([read('index.html'), read('styles.css')]);

  assert.match(html, /class="report-mock"/);
  assert.match(html, /Exemplo ilustrativo da estrutura do relatório\. Lojas anonimizadas e números fictícios\./);
  assert.match(html, /Loja A — Centro/);
  assert.match(css, /\.report-mock\s*\{/);

  assert.doesNotMatch(html, /dashboard-setorial-supermercado-v1\.png/);

  const mock = html.match(/<figure class="report-mock"[\s\S]*?<\/figure>/)?.[0];
  assert.ok(mock, 'o mockup do relatório deveria existir');
  for (const brand of ['big box', 'ultra box', 'ultrabox', 'brasília', 'bigbox']) {
    assert.ok(!mock.toLowerCase().includes(brand), `o mockup não deveria citar "${brand}"`);
  }
});

test('todas as imagens referenciadas resolvem localmente', async () => {
  const html = await read('index.html');
  const sources = [...html.matchAll(/src="(public\/assets\/[^"]+)"/g)].map((match) => match[1]);

  assert.ok(sources.length >= 12, `esperava ao menos 12 imagens, achei ${sources.length}`);
  await Promise.all(sources.map((source) => access(new URL(`../${source}`, import.meta.url))));
});

test('o rodapé inclui redes sociais e WhatsApp flutuante', async () => {
  const [html, css] = await Promise.all([read('index.html'), read('styles.css')]);

  assert.match(html, /https:\/\/www\.instagram\.com\/observall/);
  assert.match(html, /https:\/\/www\.youtube\.com\/@Observall/);
  assert.match(html, /class="whatsapp-float"[\s\S]*?wa\.me\/5561999555580/);
  assert.match(html, /class="whatsapp-icon"/);
  assert.match(css, /\.whatsapp-float svg/);
});
