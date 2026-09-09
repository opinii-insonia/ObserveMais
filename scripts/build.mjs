import { cp, mkdir, rm } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const dist = new URL('../dist/', import.meta.url);

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

// favicon.svg, robots.txt e sitemap.xml precisam ficar na raiz do dist/ para
// responderem em /favicon.svg, /robots.txt e /sitemap.xml.
for (const file of [
  'index.html',
  'styles.css',
  'script.js',
  'video.js',
  'favicon.svg',
  'robots.txt',
  'sitemap.xml',
  // Simulador interno: fora do menu e do sitemap, bloqueado no robots.txt.
  'simulador-interno-a7f39c2b.html',
  'simulador.js',
]) {
  await cp(new URL(`../${file}`, import.meta.url), new URL(`../dist/${file}`, import.meta.url));
}

await cp(new URL('../public/', import.meta.url), new URL('../dist/public/', import.meta.url), {
  recursive: true,
});

// Vertical de restaurantes: dist/restaurantes/index.html responde em /restaurantes.
await cp(new URL('../restaurantes/', import.meta.url), new URL('../dist/restaurantes/', import.meta.url), {
  recursive: true,
});

// Blog: gerado por scripts/gerar-blog.mjs antes deste passo.
await cp(new URL('../blog/', import.meta.url), new URL('../dist/blog/', import.meta.url), {
  recursive: true,
});

// Painel de publicação: noindex, sem link no site, protegido por senha na API.
await cp(new URL('../admin/', import.meta.url), new URL('../dist/admin/', import.meta.url), {
  recursive: true,
});

console.log('Build estático criado em dist/.');
