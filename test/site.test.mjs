import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');

test('a landing fala diretamente com supermercados e cliente oculto', async () => {
  const html = await read('index.html');

  assert.match(html, /Cliente oculto para supermercados/i);
  assert.match(html, /Seu supermercado perde vendas em falhas que ninguém da equipe está vendo/i);
  assert.match(html, /fila, ruptura percebida, preço ausente, validade, limpeza e atendimento/i);
  assert.match(html, /Quero diagnosticar minha loja/i);
  assert.match(html, /Evidências por setor viram[\s\S]*prioridade por loja/i);
  assert.match(html, /Cliente oculto com roteiro, evidência e[\s\S]*reunião de priorização/i);
  assert.match(html, /Dúvidas Frequentes/i);
  assert.match(html, /wa\.me\/5561993715292/);
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

  assert.match(html, /<title>Cliente oculto para supermercados \| Observe Mais<\/title>/);
  assert.match(html, /name="description"[\s\S]*Cliente oculto para supermercados/);
  assert.match(html, /property="og:image"/);
  assert.match(html, /property="og:title" content="Observe Mais — Cliente oculto para supermercados"/);
  assert.doesNotMatch(html, /primeira posição|ranking garantido|tráfego garantido/i);
});

test('usa dados estruturados somente para conteúdo visível real', async () => {
  const html = await read('index.html');
  const jsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
  const organization = jsonLd.find((item) => item['@type'] === 'Organization');
  const faq = jsonLd.find((item) => item['@type'] === 'FAQPage');

  assert.equal(organization.name, 'Observe Mais');
  assert.ok(faq.mainEntity.length >= 5);

  for (const item of faq.mainEntity) {
    assert.match(html, new RegExp(item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(html, new RegExp(item.acceptedAnswer.text.slice(0, 44).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
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
  assert.match(html, /class="brand-wordmark"/);
  assert.match(html, /class="footer-wordmark"/);
  assert.doesNotMatch(html, /Observe\+/);
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
    'public/assets/generated-supermercado/hero-supermercado-cliente-oculto-v1.png',
    'public/assets/generated-supermercado/evidencias-checklist-supermercado-v1.png',
    'public/assets/generated-supermercado/perda-silenciosa-supermercado-v1.png',
    'public/assets/generated-supermercado/diagnostico-tres-visoes-supermercado-v1.png',
    'public/assets/generated-supermercado/dashboard-setorial-supermercado-v1.png',
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

test('exibe prova social voltada a supermercados', async () => {
  const [html, css, js] = await Promise.all([read('index.html'), read('styles.css'), read('script.js')]);

  assert.match(html, /id="clientes"/);
  assert.match(html, /Supermercados que usam evidência para <span>proteger padrão de loja\.<\/span>/);
  assert.match(html, /aria-label="Logos de clientes"/);
  assert.match(html, /Conhecer resultados em supermercados/);

  for (const logo of ['goldko', 'ultrabox', 'derela', 'bigbox', 'nativas', 'tecnotica', 'lojas-mel']) {
    assert.match(html, new RegExp(`public/assets/clients/${logo}\\.png`));
  }

  assert.match(css, /@keyframes\s+logo-marquee/);
  assert.match(js, /function moveClientCarousel/);
});

test('os depoimentos reforçam execução e prioridade operacional', async () => {
  const [html, css] = await Promise.all([read('index.html'), read('styles.css')]);

  assert.match(html, /class="testimonials-section"/);
  assert.match(html, /Bruna Reges/);
  assert.match(html, /Marcus/);
  assert.match(html, /Márcia Matos/);
  assert.match(html, /Encontramos falhas de execução que não apareciam nos indicadores internos/);
  assert.match(html, /prioridade para a gestão/);
  assert.match(css, /\.testimonials-section\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*1fr\)/s);
});

test('todas as imagens referenciadas resolvem localmente', async () => {
  const html = await read('index.html');
  const sources = [...html.matchAll(/src="(public\/assets\/[^"]+)"/g)].map((match) => match[1]);

  assert.ok(sources.length >= 14);
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
