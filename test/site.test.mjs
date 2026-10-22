import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, readFile, stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import test from 'node:test';

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');

const LANDINGS = ['index.html', 'restaurantes/index.html', 'diagnostico-gratuito/index.html'];
const readLandings = () => Promise.all(LANDINGS.map(read));

// Seções do modelo, na ordem em que aparecem. Restaurantes espelha a home.
const SECOES_DO_MODELO = [
  'class="hero"',
  'class="section pain"',
  'id="como-funciona"',
  'id="plataforma"',
  'id="solucoes"',
  'id="clientes"',
  'id="segmentos"',
  'id="cases"',
  'class="section diff"',
  'id="contato"',
];

function assertOrdem(html, marcadores, pagina) {
  let anterior = -1;
  for (const marcador of marcadores) {
    const atual = html.indexOf(marcador);
    assert.ok(atual > -1, `${pagina}: faltou a seção ${marcador}`);
    assert.ok(atual > anterior, `${pagina}: ${marcador} está fora de ordem`);
    anterior = atual;
  }
}

test('a home segue a estrutura e a copy do modelo Observe+', async () => {
  const html = await read('index.html');

  assert.match(html, /<title>Observe\+ \| Enxergue o que está custando vendas<\/title>/);
  assert.match(html, /Descubra onde sua operação está <span class="accent">perdendo vendas\.<\/span>/);
  assert.match(html, /Você sabe por que alguns clientes entram, mas <span class="accent">não compram\?<\/span>/);
  assert.match(html, /Pesquisa mostra o que o cliente diz\./);
  assertOrdem(html, SECOES_DO_MODELO, 'home');

  // Os oito segmentos do modelo.
  for (const segmento of ['Varejo', 'Supermercados', 'Óticas', 'Alimentação', 'Academias', 'Clínicas', 'Franquias', 'Serviços']) {
    assert.match(html, new RegExp(`<span>${segmento}</span>`), `faltou o segmento ${segmento}`);
  }
});

test('as três landings usam o layout e o laranja do modelo, com o logo oficial', async () => {
  const [css, favicon, ...paginas] = await Promise.all([read('site.css'), read('favicon.svg'), ...LANDINGS.map(read)]);

  assert.match(css, /--navy: #0B1520;/);
  assert.match(css, /--orange: #FF6A00;/);
  assert.match(css, /--font: "Montserrat"/);

  // A identidade voltou ao laranja: nenhum resto da fase verde.
  for (const fonte of [css, favicon, ...paginas]) {
    assert.doesNotMatch(fonte, /--green|#25D670|#12924A|#3BE584|#1FC45E|#4BF07F|37, ?214, ?112/i);
  }

  paginas.forEach((html, i) => {
    assert.match(html, /<link rel="stylesheet" href="\/site\.css">/, `${LANDINGS[i]} sem site.css`);
    assert.match(html, /<script src="\/site\.js" defer><\/script>/, `${LANDINGS[i]} sem site.js`);
    assert.match(html, /family=Montserrat/);
    // Logo oficial em vetor (redesenhado do quadro de identidade), com a assinatura da marca.
    assert.match(html, /<symbol id="logo-full" viewBox="[^"]+">/);
    assert.match(html, /<symbol id="logo-mark" viewBox="[^"]+">/);
    // O <use> já aplica o viewBox do símbolo: o svg externo precisa começar em 0 0,
    // senão o deslocamento vertical do símbolo é aplicado duas vezes e corta o logo.
    assert.match(html, /<svg class="brand-logo" viewBox="0 0 [\d.]+ [\d.]+" aria-hidden="true"><use href="#logo-full"\/><\/svg>/);
    assert.match(html, /<span class="brand-tagline">Ver\. Provar\. Agir\.<\/span>/);
    assert.doesNotMatch(html, /brand-name|brand-mark/);
    // O visual do blog não pode vazar para as landings.
    assert.doesNotMatch(html, /styles\.css|script\.js|Poppins/);
  });

  for (const arquivo of ['logo-observe-mais.svg', 'logo-observe-mais-branco.svg', 'simbolo-observe-mais.svg']) {
    await access(new URL(`../public/assets/observe/${arquivo}`, import.meta.url));
  }
  assert.match(favicon, /id="ffundo"[^>]*fill="#0B1520"/);
  assert.match(favicon, /#FF6A00/, 'favicon em laranja');
});

test('a vertical de restaurantes espelha a home com o vocabulário do salão', async () => {
  const [resto, index, build, sitemap, vercel] = await Promise.all([
    read('restaurantes/index.html'),
    read('index.html'),
    read('scripts/build.mjs'),
    read('sitemap.xml'),
    read('vercel.json'),
  ]);

  assertOrdem(resto, SECOES_DO_MODELO, 'restaurantes');
  assert.match(resto, /<title>Cliente oculto para restaurantes \| Observe\+<\/title>/);
  assert.match(resto, /Descubra onde seu restaurante está <span class="accent">perdendo vendas\.<\/span>/);
  assert.match(resto, /rel="canonical" href="https:\/\/observemais\.com\.br\/restaurantes"/);

  // Linguagem de quem opera a casa, não de consultoria.
  for (const termo of ['comanda', 'passagem', 'ficha técnica', 'praça', 'em 86', 'ticket médio', 'sobremesa']) {
    assert.ok(resto.includes(termo), `a vertical perdeu o termo de operação "${termo}"`);
  }
  for (const termo of ['supermercado', 'gôndola', 'Big Box', 'Ultrabox', 'bigbox']) {
    assert.ok(!resto.toLowerCase().includes(termo.toLowerCase()), `sobrou "${termo}" na página de restaurantes`);
  }

  // A home não linka a vertical: só se chega por URL.
  assert.doesNotMatch(index, /restaurante/i);

  assert.match(build, /'\.\.\/restaurantes\/'/);
  assert.match(sitemap, /<loc>https:\/\/observemais\.com\.br\/restaurantes<\/loc>/);
  assert.match(vercel, /"source": "\/restaurante"/, 'o singular precisa redirecionar para o plural');
});

test('cartão de compartilhamento completo e absoluto nas três landings', async () => {
  const paginas = await readLandings();

  for (const [i, html] of paginas.entries()) {
    assert.match(html, /<link rel="canonical" href="https:\/\/observemais\.com\.br\//);
    assert.match(html, /<link rel="icon" type="image\/svg\+xml" href="\/favicon\.svg">/);
    assert.match(html, /<link rel="apple-touch-icon"/);
    assert.match(html, /name="robots" content="index, follow/);
    assert.match(html, /property="og:image:width" content="1200"/);
    assert.match(html, /property="og:image:height" content="630"/);
    assert.match(html, /name="twitter:card" content="summary_large_image"/);

    for (const tag of ['og:image', 'twitter:image']) {
      const url = html.match(new RegExp(`(?:property|name)="${tag}" content="([^"]+)"`))?.[1];
      assert.ok(url, `${LANDINGS[i]}: faltou ${tag}`);
      assert.match(url, /^https:\/\/observemais\.com\.br\/public\/assets\/.+\.jpg$/);
      // WhatsApp e Facebook costumam desistir da prévia acima de ~600KB.
      const info = await stat(new URL(`../${url.replace('https://observemais.com.br/', '')}`, import.meta.url));
      assert.ok(info.size < 600 * 1024, `${url} tem ${Math.round(info.size / 1024)}KB`);
    }
  }
});

test('todas as imagens das landings resolvem localmente, com alt e peso controlado', async () => {
  const paginas = await readLandings();

  for (const [i, html] of paginas.entries()) {
    const fontes = [...html.matchAll(/(?:src|srcset)="(\/public\/assets\/[^"]+)"/g)].map((m) => m[1]);
    assert.ok(fontes.length >= 4, `${LANDINGS[i]}: esperava ao menos 4 imagens, achei ${fontes.length}`);

    for (const fonte of fontes) {
      // Caminho absoluto: /restaurantes e /diagnostico-gratuito não vivem na raiz.
      assert.match(fonte, /^\/public\/assets\/[a-z0-9/_.-]+$/, `caminho de asset inseguro: ${fonte}`);
      const info = await stat(new URL(`..${fonte}`, import.meta.url));
      assert.ok(info.size < 250 * 1024, `${fonte} tem ${Math.round(info.size / 1024)}KB`);
    }

    for (const tag of html.match(/<img[^>]*>/g) || []) {
      assert.match(tag, /\salt="[^"]*"/, `${LANDINGS[i]}: imagem sem alt: ${tag.slice(0, 90)}`);
    }
  }
});

test('onde o modelo tinha lacuna, entram dados reais da Observe+', async () => {
  const [index, resto, diag] = await readLandings();

  // Nenhum marcador de preenchimento do modelo pode ir ao ar.
  for (const html of [index, resto, diag]) {
    assert.doesNotMatch(html, /logo-slot|Logo do cliente|NOME\.svg|\bXX? ?%|XX unidades|class="stats"/);
    assert.doesNotMatch(html, /href="#"/, 'link vazio herdado do modelo');
  }

  // Só clientes confirmados.
  for (const html of [index, diag]) {
    for (const logo of ['bigbox', 'ultrabox', 'nativas', 'tecnotica']) {
      assert.match(html, new RegExp(`/public/assets/clients/${logo}\\.png`), `faltou o logo ${logo}`);
    }
  }
  for (const html of [index, resto, diag]) {
    assert.doesNotMatch(html, /lojas-mel|goldko|derela/i, 'logo de cliente não confirmado');
  }
  assert.match(index, /Bruna Reges/);
  assert.match(index, /Márcia Matos/);
  assert.match(index, /Marcus · Gerente Geral/);
  assert.match(resto, /Churrascaria Nativas SIA/);

  // Contato, redes e vídeo institucional.
  for (const html of [index, resto]) {
    assert.match(html, /mailto:contato@observemais\.com\.br/);
    assert.match(html, /https:\/\/www\.instagram\.com\/observall/);
    assert.match(html, /https:\/\/www\.youtube\.com\/@Observall/);
    assert.match(html, /wa\.me\/5561993715292/);
    assert.match(html, /class="whatsapp-float" href="https:\/\/wa\.me\/5561999555580/);
    assert.match(html, /data-video="yuGAr_NQis8"/);
    assert.match(html, /<a href="\/blog">/);
  }
  assert.match(await read('site.js'), /youtube-nocookie\.com\/embed/);
});

test('nada de exemplo fictício: só entra o que é real', async () => {
  const [index, resto, diag] = await readLandings();

  for (const html of [index, resto, diag]) {
    // Painel com números inventados, cases ilustrativos e resultados deduzidos saíram.
    assert.doesNotMatch(html, /ilustrativ|Cenário|fictíci/i);
    assert.doesNotMatch(html, /class="devices|class="report-card|class="case-flow|app-card/);
  }

  // Depoimentos: texto real, com o logo real do cliente no lugar de foto de banco de imagem.
  assert.equal([...index.matchAll(/<article class="case"/g)].length, 3);
  assert.equal([...resto.matchAll(/<article class="case"/g)].length, 1);
  for (const html of [index, resto]) {
    for (const media of html.match(/<div class="case-media[^"]*">\s*<img src="[^"]+"/g) || []) {
      assert.match(media, /case-media--logo">\s*<img src="\/public\/assets\/clients\//);
    }
  }

  for (const html of [index, resto, diag]) {
    assert.doesNotMatch(html, /ROI garantido|aumento de vendas garantido|lucro garantido|líder de mercado|melhor empresa/i);
    assert.doesNotMatch(html, /id="roi-form"|simulador-interno/);
  }
});

test('home e restaurantes usam o formulário da Kommo, e todo CTA leva até ele', async () => {
  const [index, resto, js, css] = await Promise.all([
    read('index.html'),
    read('restaurantes/index.html'),
    read('site.js'),
    read('site.css'),
  ]);

  for (const html of [index, resto]) {
    // Código da Kommo exatamente uma vez, dentro do bloco #contato: o script
    // insere o formulário logo antes da própria tag.
    const contato = html.match(/<section class="final-cta final-cta--form" id="contato"[\s\S]*?<\/section>/)?.[0];
    assert.ok(contato, 'faltou o bloco #contato');
    assert.match(contato, /<div class="kommo-form" id="formulario">[\s\S]*a\[o\+r\]\(\{id:"1734095",hash:"04a0a9cda52e3f6789d1bad640123783",locale:"pt"\}\)[\s\S]*<script id="amoforms_script_1734095" async="async" charset="utf-8" src="https:\/\/forms\.kommo\.com\/forms\/assets\/js\/amoforms\.js\?1792506232"><\/script>\s*<\/div>/);
    assert.equal([...html.matchAll(/<script id="amoforms_script_1734095"/g)].length, 1);

    // O modal antigo saiu: nenhum CTA pode abrir formulário que não existe.
    assert.doesNotMatch(html, /data-lead-flow|id="lead-flow"|lead-step/);
    assert.ok([...html.matchAll(/href="#contato"/g)].length >= 5, 'os CTAs precisam levar ao formulário');
  }

  assert.doesNotMatch(js, /leadFlow|mostrarEtapa/);
  assert.match(css, /\.kommo-form iframe \{ max-width: 100% !important; \}/, 'a Kommo fixa 440px no celular');
});

test('o lead segue para a planilha sem credencial no navegador', async () => {
  const [api, appsScript, js] = await Promise.all([
    read('api/lead-capture.js'),
    read('scripts/planilha-leads.gs'),
    read('site.js'),
  ]);

  assert.match(api, /SHEETS_WEBHOOK_URL/);
  assert.match(api, /SHEETS_WEBHOOK_SECRET/);
  assert.match(api, /function enviarParaPlanilha/);

  // Falha na planilha não pode derrubar a captura: o lead já está no Blob.
  assert.match(api, /catch[\s\S]*?return 'falhou'/);

  // Apps Script devolve 200 mesmo recusando; o corpo precisa ser inspecionado.
  assert.match(api, /dados\?\.ok === true \|\| dados\?\.status === 'success'/);

  assert.match(appsScript, /function doPost/);
  assert.match(appsScript, /dados\.segredo !== SEGREDO/);

  // O segredo e a URL do Apps Script nunca podem aparecer no frontend.
  assert.doesNotMatch(js, /SHEETS_WEBHOOK|script\.google\.com|docs\.google\.com|process\.env/);

  // O caminho direto para o Zapier existe, e um destino caído não perde o lead.
  assert.match(js, /const ZAPIER_WEBHOOK = /);
  assert.match(js, /return zapier === true \|\| api === true/);
  assert.match(js, /mode: 'no-cors'/);
});

test('o diagnóstico manda os campos no primeiro nível, prontos para a planilha', async () => {
  const js = await read('site.js');
  const payloads = [...js.matchAll(/const payload = \{[\s\S]*?\n\s*\};/g)].map((m) => m[0]);

  assert.equal(payloads.length, 1, 'só o diagnóstico envia pelo site; o contato é da Kommo');
  const [payload] = payloads;
  for (const campo of ['source', 'tipo', 'origem', 'createdAt', 'segmento', 'localizacao', 'cidade', 'unidades', 'qualificado', 'motivo']) {
    assert.match(payload, new RegExp(`^\\s+${campo}[:,]`, 'm'), `${campo} fora do primeiro nível`);
  }
  assert.match(payload, /\.\.\.lead,/);
  assert.match(js, /const lead = \{\s*nome:[\s\S]*?empresa:[\s\S]*?email:[\s\S]*?whatsapp:/);
});

test('diagnóstico gratuito: aprova só Brasília/DF com 4 ou mais unidades', async () => {
  const { avaliarDiagnostico } = await import('../api/lead-capture.js');

  assert.equal(avaliarDiagnostico({ localizacao: 'df', unidades: 4 }).qualificado, true);
  assert.equal(avaliarDiagnostico({ localizacao: 'df', unidades: 12 }).qualificado, true);
  assert.equal(avaliarDiagnostico({ localizacao: 'df', unidades: 3 }).qualificado, false);
  assert.equal(avaliarDiagnostico({ localizacao: 'entorno', unidades: 10 }).qualificado, false);
  assert.equal(avaliarDiagnostico({ localizacao: 'outra', unidades: 1 }).motivo, 'fora de Brasília/DF e menos de 4 unidades');

  // A tela usa a mesma regra que a planilha.
  const js = await read('site.js');
  assert.match(js, /regiaoAtendida: 'df',/);
  assert.match(js, /unidadesMinimas: 4,/);
  assert.match(await read('api/lead-capture.js'), /const DIAGNOSTICO_UNIDADES_MINIMAS = 4;/);
});

test('diagnóstico gratuito: a API grava todos e recalcula a aprovação no servidor', async () => {
  const { default: handler } = await import('../api/lead-capture.js');
  delete process.env.SHEETS_WEBHOOK_URL;
  delete process.env.BLOB_READ_WRITE_TOKEN;

  async function enviar(qualificacao, extras = {}) {
    const corpo = JSON.stringify({
      source: 'observe-mais-diagnostico-gratuito',
      tipo: 'diagnostico-gratuito',
      lead: { nome: 'Lead Teste', empresa: 'Rede Teste', whatsapp: '(61) 99999-9999', email: 'lead@example.com', cargo: 'Diretor' },
      qualificacao,
      ...extras,
    });
    const request = Readable.from([corpo]);
    request.method = 'POST';
    request.headers = {};

    let status;
    let json;
    const response = {
      setHeader() {},
      status(code) { status = code; return this; },
      json(dados) { json = dados; },
    };
    await handler(request, response);
    return { status, json };
  }

  const aprovado = await enviar({ segmento: 'Varejo', localizacao: 'df', unidades: '6' });
  assert.equal(aprovado.status, 200);
  assert.equal(aprovado.json.ok, true);
  assert.equal(aprovado.json.qualificado, true);

  // Quem não tem o perfil também é cadastrado; só não é aprovado.
  const fora = await enviar({ segmento: 'Varejo', localizacao: 'outra', cidade: 'Goiânia - GO', unidades: '9' });
  assert.equal(fora.status, 200);
  assert.equal(fora.json.qualificado, false);

  // O navegador não decide a aprovação: valor forjado é ignorado.
  const forjado = await enviar({ localizacao: 'df', unidades: '1' }, { qualificado: 'sim' });
  assert.equal(forjado.json.qualificado, false);
});

test('diagnóstico gratuito: página de anúncio com formulário curto e respostas', async () => {
  const [html, build, sitemap, vercel, appsScript] = await Promise.all([
    read('diagnostico-gratuito/index.html'),
    read('scripts/build.mjs'),
    read('sitemap.xml'),
    read('vercel.json'),
    read('scripts/planilha-leads.gs'),
  ]);

  assert.match(html, /<title>Diagnóstico gratuito de cliente oculto \| Observe\+<\/title>/);
  assert.match(html, /rel="canonical" href="https:\/\/observemais\.com\.br\/diagnostico-gratuito"/);

  // Página de anúncio: a primeira seção já traz o formulário, e não há menu para dispersar.
  const sections = [...html.matchAll(/<section class="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(sections[0], 'dx-hero');
  const primeira = html.match(/<section class="dx-hero"[\s\S]*?<\/section>/)[0];
  assert.match(primeira, /<form id="diagnostico-form" novalidate/);
  assert.doesNotMatch(html, /class="main-nav"|class="nav-toggle"/);

  // Formulário único e curto.
  assert.doesNotMatch(html, /data-panel|form-steps/);
  for (const campo of ['nome', 'whatsapp', 'email', 'empresa', 'segmento', 'localizacao', 'unidades', 'cidade']) {
    assert.match(html, new RegExp(`name="${campo}"`), `faltou o campo ${campo}`);
  }
  const form = html.match(/<form id="diagnostico-form"[\s\S]*?<\/form>/)[0];
  assert.ok([...form.matchAll(/ name="/g)].length <= 8, 'o formulário do anúncio precisa ser curto');
  assert.match(html, /<option value="df">Brasília \/ Distrito Federal<\/option>/);
  assert.match(html, /id="diagnostico-aprovado"/);
  assert.match(html, /id="diagnostico-cadastrado"/);
  assert.match(html, /Brasília \(DF\) com 4 ou mais unidades/);
  assert.doesNotMatch(html, /data-lead-flow|id="lead-flow"|amoforms/);

  assert.match(appsScript, /const ABA_DIAGNOSTICO = 'Diagnóstico gratuito';/);
  assert.match(appsScript, /'Qualificado'/);
  assert.match(appsScript, /dados\.tipo === 'diagnostico-gratuito'/);

  assert.match(build, /'\.\.\/diagnostico-gratuito\/'/);
  assert.match(sitemap, /<loc>https:\/\/observemais\.com\.br\/diagnostico-gratuito<\/loc>/);
  assert.match(vercel, /"source": "\/diagnostico",\s*"destination": "\/diagnostico-gratuito"/);
});

test('as landings continuam semânticas, acessíveis e responsivas', async () => {
  const [css, ...paginas] = await Promise.all([read('site.css'), ...LANDINGS.map(read)]);

  for (const html of paginas) {
    assert.match(html, /<a class="skip-link" href="#[a-z-]+">/);
    assert.match(html, /<header class="site-header/);
    assert.match(html, /<main id="conteudo">/);
    assert.match(html, /<footer class="site-footer">/);
    assert.match(html, /<html lang="pt-BR">/);
  }
  for (const html of paginas.slice(0, 2)) assert.match(html, /aria-label="Navegação principal"/);
  assert.match(css, /@media \(max-width: 767px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /:focus-visible/);
});

test('não incorpora marca, URLs ou copies de terceiros', async () => {
  const fontes = `${(await readLandings()).join('\n')}\n${await read('site.css')}\n${await read('site.js')}`;

  assert.doesNotMatch(fontes, /seuclienteoculto|Seu Cliente Oculto|SCO Experience|observemais\.vercel\.app/i);
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

test('o simulador de ROI sai da landing e vive em página interna', async () => {
  const [html, interno, simulador, build, robots] = await Promise.all([
    read('index.html'),
    read('simulador-interno-a7f39c2b.html'),
    read('simulador.js'),
    read('scripts/build.mjs'),
    read('robots.txt'),
  ]);

  // Fora da landing e de qualquer navegação.
  assert.doesNotMatch(html, /simulador-interno|simulador\.js|id="roi-form"/);

  assert.match(interno, /name="robots" content="noindex, nofollow/);
  assert.match(interno, /id="revenue"/, 'faltou o campo de faturamento');
  assert.match(interno, /Fórmula por trás do cálculo/);
  assert.match(interno, /Uso interno/);

  // A fórmula publicada tem que bater com a implementada.
  assert.match(simulador, /observallVisitPrice:\s*300/);
  assert.match(simulador, /couponGrowth:\s*0\.1/);
  assert.match(simulador, /ticketGrowth:\s*0\.12/);
  assert.match(interno, /R\$ 300/);
  assert.match(interno, /\+10%/);
  assert.match(interno, /\+12%/);

  assert.match(build, /simulador-interno-a7f39c2b\.html/);
  assert.match(build, /'simulador\.js'/);

  // robots.txt é público: citar o caminho interno ali o entregaria.
  assert.doesNotMatch(robots, /simulador/i);
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

test('o blog é gerado a partir dos artigos e sai no build', async () => {
  const { artigos } = await import('../scripts/blog-artigos.mjs');
  const [indice, build, sitemap, pkg] = await Promise.all([
    read('blog/index.html'),
    read('scripts/build.mjs'),
    read('sitemap.xml'),
    read('package.json'),
  ]);

  assert.ok(artigos.length >= 5, `esperava ao menos 5 artigos, achei ${artigos.length}`);

  // As páginas de artigo deixaram de ser arquivos: todas passam por api/artigo.js.
  // Enquanto eram arquivos estáticos, a Vercel os servia antes da função e o
  // painel não conseguia tirar do ar os artigos que vêm do código.
  for (const artigo of artigos) {
    assert.ok(indice.includes(`/blog/${artigo.slug}`), `${artigo.slug} não está no índice`);
    assert.ok(sitemap.includes(`/blog/${artigo.slug}<`), `${artigo.slug} não está no sitemap`);
  }

  const rota = await read('api/artigo.js');
  assert.match(rota, /versionados\.find\(/, 'a rota precisa servir também os artigos do código');

  assert.match(build, /'\.\.\/blog\/'/);
  assert.match(pkg, /"blog": "node scripts\/gerar-blog\.mjs"/);
  assert.match(pkg, /gerar-blog\.mjs && node scripts\/build\.mjs/, 'o build precisa regerar o blog antes de copiar');
});

test('o blog tem busca própria e conteúdo autoral com fonte citada', async () => {
  const { artigos } = await import('../scripts/blog-artigos.mjs');
  const [indice, js, css] = await Promise.all([read('blog/index.html'), read('script.js'), read('styles.css')]);

  assert.match(indice, /data-blog-busca/);
  assert.match(indice, /data-blog-lista/);
  assert.match(js, /data-blog-busca/);
  assert.match(css, /\.post-card\s*\{/);

  // Cada cartão carrega o texto indexável que a busca filtra.
  const cartoes = [...indice.matchAll(/data-busca="([^"]+)"/g)];
  assert.equal(cartoes.length, artigos.length);

  // Todo artigo precisa declarar as fontes que consultou.
  for (const artigo of artigos) {
    const fontes = artigo.corpo.find((bloco) => bloco.tipo === 'fontes');
    assert.ok(fontes?.itens?.length, `o artigo ${artigo.slug} não cita fonte`);
    for (const fonte of fontes.itens) {
      assert.match(fonte.url, /^https:\/\//, `fonte sem URL válida em ${artigo.slug}`);
    }
  }
});

test('o blog não reproduz marca nem conteúdo de concorrente', async () => {
  const { artigos } = await import('../scripts/blog-artigos.mjs');
  const paginas = await Promise.all([read('blog/index.html'), read('scripts/blog-artigos.mjs')]);

  for (const pagina of paginas) {
    assert.doesNotMatch(pagina, /seuclienteoculto/i);
    assert.doesNotMatch(pagina, /Seu Cliente Oculto/);
    assert.doesNotMatch(pagina, /usebaratao/i);
  }
});

test('o painel de publicação não expõe segredo em nada que o navegador baixa', async () => {
  const publicos = await Promise.all([
    read('admin/index.html'),
    read('admin/admin.js'),
    read('blog/index.html'),
    read('script.js'),
    read('index.html'),
    read('restaurantes/index.html'),
    read('site.js'),
    read('diagnostico-gratuito/index.html'),
  ]);

  for (const fonte of publicos) {
    // Citar o nome da variável em mensagem de ajuda é aceitável; o que não pode
    // é o valor dela, nem qualquer senha literal, chegar ao navegador.
    assert.doesNotMatch(fonte, /process\.env/, 'o frontend não deve ler variável de ambiente');
    assert.doesNotMatch(fonte, /senha\s*[:=]\s*['"][^'"]{3,}['"]/i, 'senha embutida no frontend');
    assert.doesNotMatch(fonte, /BLOG_ADMIN_SENHA\s*[:=]/, 'valor da senha embutido');
  }

  // O token de sessão não pode sobreviver ao fechamento da aba. Os comentários
  // são removidos antes: eles citam localStorage justamente para explicar a ausência.
  const painel = publicos[1].replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((l) => !l.trim().startsWith('//')).join(' ');
  assert.doesNotMatch(painel, /localStorage|sessionStorage|document\.cookie/);
  assert.match(painel, /let token = null/);
});

test('a API do painel exige senha do ambiente e sessão assinada', async () => {
  const api = await read('api/blog-admin.js');

  // Sem a variável configurada o painel não abre — não há senha padrão.
  assert.match(api, /process\.env\.BLOG_ADMIN_SENHA/);
  assert.match(api, /painel_nao_configurado/);

  // Comparação em tempo constante: === vazaria a senha por medição de tempo.
  assert.match(api, /timingSafeEqual/);
  assert.doesNotMatch(api, /senha === |=== senhaConfigurada/);

  // Sessão assinada com validade, e toda ação que não é login exige token.
  assert.match(api, /createHmac\('sha256'/);
  assert.match(api, /function tokenValido/);
  assert.match(api, /if \(!tokenValido\(dados\?\.token\)\)/);

  // Login errado responde com atraso, para encarecer força bruta.
  assert.match(api, /setTimeout\(r, \d{3,}\)/);
});

test('o conteúdo digitado no painel não vira HTML executável', async () => {
  const { textoParaBlocos } = await import('../scripts/blog-markdown.mjs');

  const blocos = textoParaBlocos('<script>alert(1)</script>\n\n## Título <b>x</b>\n\n- item "aspas"\n\n> destaque\n\n**forte**');
  const serializado = JSON.stringify(blocos);

  // Toda tag digitada precisa chegar escapada.
  assert.doesNotMatch(serializado, /<script>/);
  assert.doesNotMatch(serializado, /<b>/);
  assert.match(serializado, /&lt;script&gt;/);

  // A marcação permitida continua funcionando.
  assert.equal(blocos.find((b) => b.tipo === 'h2')?.texto, 'Título &lt;b&gt;x&lt;/b&gt;');
  assert.ok(blocos.some((b) => b.tipo === 'lista'));
  assert.ok(blocos.some((b) => b.tipo === 'destaque'));
  assert.ok(blocos.some((b) => b.texto?.includes('<strong>forte</strong>')));
});

test('o painel fica fora do site público e do índice de busca', async () => {
  const [painel, robots, sitemap, index, resto, blog, build, diag] = await Promise.all([
    read('admin/index.html'),
    read('robots.txt'),
    read('sitemap.xml'),
    read('index.html'),
    read('restaurantes/index.html'),
    read('blog/index.html'),
    read('scripts/build.mjs'),
    read('diagnostico-gratuito/index.html'),
  ]);

  assert.match(painel, /name="robots" content="noindex, nofollow/);

  // Nenhuma página pública pode linkar o painel, e o caminho não entra no
  // robots.txt nem no sitemap — os dois são públicos e entregariam o endereço.
  for (const publica of [index, resto, diag, blog, robots, sitemap]) {
    assert.doesNotMatch(publica, /\/admin/);
  }

  assert.match(build, /'\.\.\/admin\/'/, 'o painel precisa ir para o dist');
});

test('artigo publicado pelo painel usa o mesmo renderizador dos versionados', async () => {
  const [render, gerador, artigoApi, vercel] = await Promise.all([
    read('scripts/blog-render.mjs'),
    read('scripts/gerar-blog.mjs'),
    read('api/artigo.js'),
    read('vercel.json'),
  ]);

  // Um renderizador só: é o que garante página idêntica nos dois caminhos.
  assert.match(render, /export function paginaArtigo/);
  assert.match(gerador, /from '\.\/blog-render\.mjs'/);
  assert.match(artigoApi, /from '\.\.\/scripts\/blog-render\.mjs'/);

  // A rota dinâmica só é alcançada quando não existe arquivo estático.
  assert.match(vercel, /"source": "\/blog\/:slug"/);
  assert.match(vercel, /"destination": "\/api\/artigo\?slug=:slug"/);
});

test('a auditoria de assets enxerga o que o CSS carrega', async () => {
  const script = await read('scripts/assets-nao-usados.mjs');

  // Varrer só o HTML deixava passar background-image, que é o caso mais caro.
  assert.match(script, /styles\.css/);
  assert.match(script, /site\.css/);
  assert.match(script, /diagnostico-gratuito\/index\.html/);
  assert.ok(script.includes(String.raw`url\(`), 'a varredura precisa cobrir url() do CSS');
  assert.match(script, /restaurantes\/index\.html/);
});

test('o botão de postagem existe no blog e abre o modal de credenciais', async () => {
  const [indice, editor, build] = await Promise.all([
    read('blog/index.html'),
    read('blog-editor.js'),
    read('scripts/build.mjs'),
  ]);

  // A entrada fica no menu, discreta: não pode competir com o CTA de conversão.
  const nav = indice.match(/<nav id="main-navigation"[\s\S]*?<\/nav>/)?.[0];
  assert.match(nav, /class="nav-postar"[^>]*data-abrir-editor>Fazer uma postagem</);
  assert.doesNotMatch(indice, /blog-acoes/);
  assert.match(indice, /id="editor-modal"/);
  assert.match(indice, /data-form-login/);
  assert.match(indice, /id="ed-capa"/, 'faltou o campo de capa');
  assert.match(indice, /id="ed-imagem"/, 'faltou inserir imagem no texto');

  assert.match(indice, /blog-editor\.js/);
  assert.match(build, /'blog-editor\.js'/);
  assert.match(indice, /<p class="admin-ajuda">Acesso restrito\.<\/p>/);

  // O editor não pode guardar credencial nem sessão fora da memória.
  const semComentario = editor.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((l) => !l.trim().startsWith('*') && !l.trim().startsWith('//')).join(' ');
  assert.doesNotMatch(semComentario, /localStorage|sessionStorage|document\.cookie/);
  assert.doesNotMatch(semComentario, /BLOG_ADMIN|process\.env/);
  assert.match(editor, /let token = null/);
});

test('o upload de imagem confere os bytes, não o tipo declarado', async () => {
  const api = await read('api/blog-admin.js');

  // Quem chama a API escolhe o Content-Type; só a assinatura do arquivo prova o formato.
  assert.match(api, /function identificarImagem/);
  assert.match(api, /0xff, 0xd8, 0xff/, 'faltou a assinatura do JPEG');
  assert.match(api, /0x89, 0x50, 0x4e, 0x47/, 'faltou a assinatura do PNG');
  assert.match(api, /'WEBP'/, 'RIFF sozinho também é áudio: precisa conferir o offset 8');
  assert.match(api, /formato_nao_suportado/);

  // Limite de tamanho e nome imprevisível.
  assert.match(api, /LIMITE_IMAGEM/);
  assert.match(api, /randomBytes\(6\)/);

  // Upload exige sessão: fica depois da verificação de token.
  const posToken = api.indexOf("if (!tokenValido(dados?.token))");
  const posImagem = api.indexOf("acao === 'imagem'");
  assert.ok(posToken > -1 && posImagem > posToken, 'o upload precisa vir depois da checagem de sessão');
});

test('imagem no artigo só aponta para o armazenamento do próprio site', async () => {
  const { textoParaBlocos } = await import('../scripts/blog-markdown.mjs');

  const externa = textoParaBlocos('![x](https://site-qualquer.com/rastreador.gif)');
  assert.equal(externa.filter((b) => b.tipo === 'imagem').length, 0, 'link externo não pode virar imagem');

  const propria = textoParaBlocos('![Gôndola vazia](https://abc123.public.blob.vercel-storage.com/blog-imagens/x.jpg)');
  const bloco = propria.find((b) => b.tipo === 'imagem');
  assert.ok(bloco, 'imagem do próprio armazenamento deveria ser aceita');
  assert.equal(bloco.alt, 'Gôndola vazia');

  // javascript: e data: não podem passar.
  for (const url of ['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>']) {
    assert.equal(textoParaBlocos(`![x](${url})`).filter((b) => b.tipo === 'imagem').length, 0);
  }
});

test('o lead é gravado cifrado, porque o store do projeto é público', async () => {
  const [captura, exporta, cofre] = await Promise.all([
    read('api/lead-capture.js'),
    read('api/leads-export.js'),
    read('api/_leads-cofre.js'),
  ]);

  // O store criado é público; pedir 'private' contra ele falha e o lead se perde.
  assert.match(captura, /access: 'public'/);
  assert.doesNotMatch(captura, /access: 'private'/);
  assert.doesNotMatch(exporta, /access: 'private'/);

  // Dado pessoal não pode ir em claro para endereço público.
  assert.match(captura, /cifrar\(record\)/);
  assert.match(exporta, /decifrar\(/);
  assert.match(cofre, /aes-256-gcm/);

  // GCM autentica: arquivo adulterado falha em vez de devolver lixo.
  assert.match(cofre, /getAuthTag|setAuthTag/);
});

test('o cofre cifra de verdade e continua lendo o formato antigo', async () => {
  const { cifrar, decifrar } = await import('../api/_leads-cofre.js');
  process.env.LEADS_CHAVE = process.env.LEADS_CHAVE || 'chave-de-teste-para-o-cofre';

  const lead = { id: 'abc', lead: { nome: 'Fulano de Tal', email: 'fulano@exemplo.com' } };
  const { conteudo, cifrado } = cifrar(lead);

  assert.equal(cifrado, true);
  assert.ok(!conteudo.includes('Fulano'), 'o nome não pode aparecer em claro no armazenamento');
  assert.ok(!conteudo.includes('fulano@exemplo.com'), 'o e-mail não pode aparecer em claro');
  assert.deepEqual(decifrar(conteudo), lead);

  // Leads gravados antes da cifragem precisam continuar exportáveis.
  assert.deepEqual(decifrar(JSON.stringify(lead)), lead);

  // Conteúdo adulterado não pode passar como válido.
  const adulterado = conteudo.slice(0, -6) + 'AAAAAA';
  assert.throws(() => decifrar(adulterado));
});

test('o painel remove qualquer artigo, dos dois tipos', async () => {
  const [api, editor, rota, feed] = await Promise.all([
    read('api/blog-admin.js'),
    read('blog-editor.js'),
    read('api/artigo.js'),
    read('api/blog-feed.js'),
  ]);

  // A listagem precisa trazer os dois, marcando de onde vêm.
  assert.match(api, /origem: 'painel'/);
  assert.match(api, /origem: 'codigo'/);

  // Artigo do painel some do armazenamento; o do código entra na lista de ocultos,
  // porque o arquivo continua no repositório.
  assert.match(api, /await del\(blobs\[0\]\.url\)/);
  assert.match(api, /gravarOcultos\(\[\.\.\.ocultos, slug\]\)/);
  assert.match(api, /acao === 'restaurar'/, 'esconder precisa ter volta');

  // A rota respeita a lista e some com o artigo escondido.
  assert.match(rota, /ocultos\.includes\(slug\)/);

  // Se o armazenamento cair, os artigos do código não podem sumir junto.
  assert.match(rota, /export async function lerOcultos/);
  assert.match(rota, /catch \{\s*return \[\];\s*\}/s, 'a leitura de ocultos precisa falhar aberta');

  // O índice é estático: o feed diz o que esconder sem precisar de novo build.
  assert.match(feed, /ocultos/);
  assert.match(editor, /acao: 'restaurar'/);
  assert.match(editor, /data-lista-artigos/);

  // Remoção definitiva precisa avisar que não tem volta.
  assert.match(editor, /não tem volta/);
});

test('artigo publicado aparece na hora para quem publicou', async () => {
  const [feed, rota, script, editor] = await Promise.all([
    read('api/blog-feed.js'),
    read('api/artigo.js'),
    read('script.js'),
    read('blog-editor.js'),
  ]);

  // Cache longo no feed faz a publicação demorar a aparecer.
  const segundosFeed = Number(feed.match(/s-maxage=(\d+)/)?.[1]);
  assert.ok(segundosFeed <= 30, `feed com s-maxage de ${segundosFeed}s atrasa demais a publicação`);

  // Republicar o mesmo slug precisa refletir rápido na página do artigo.
  const segundosArtigo = Number(rota.match(/max-age=(\d+), s-maxage=/)?.[1]);
  assert.ok(segundosArtigo <= 60, `artigo com cache de ${segundosArtigo}s atrasa a republicação`);

  // Quem publicou não espera cache nenhum: a grade é remontada ignorando o CDN.
  assert.match(script, /function atualizarGradeDoBlog/);
  assert.match(script, /window\.atualizarGradeDoBlog = atualizarGradeDoBlog/);
  assert.match(script, /blog-feed\?t=\$\{Date\.now\(\)\}/, 'precisa de parâmetro único para furar o cache');
  assert.match(editor, /atualizarGradeDoBlog\?\.\(\{ semCache: true \}\)/);
});

test('o blog aparece no menu das landings e volta para elas', async () => {
  const [index, resto, indiceBlog] = await Promise.all([
    read('index.html'),
    read('restaurantes/index.html'),
    read('blog/index.html'),
  ]);

  for (const [pagina, nome] of [[index, 'home'], [resto, 'restaurantes']]) {
    const nav = pagina.match(/<nav class="main-nav" id="main-nav"[\s\S]*?<\/nav>/)?.[0];
    assert.ok(nav, `não achei o menu da página ${nome}`);
    assert.match(nav, /<a href="\/blog">Conteúdos<\/a>/, `faltou o link do blog no menu de ${nome}`);
  }

  assert.match(indiceBlog, /<a href="\/">Início<\/a>/);
  assert.match(indiceBlog, /<a href="\/restaurantes">Restaurantes<\/a>/);
  assert.match(indiceBlog, /<a href="\/diagnostico-gratuito">Diagnóstico gratuito<\/a>/);
});
