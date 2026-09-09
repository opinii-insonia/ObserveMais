/**
 * Gera o blog a partir de scripts/blog-artigos.mjs.
 *
 * Escreve dentro de `blog/`, versionado, para o servidor local enxergar as
 * páginas e para o build só precisar copiar. Rode `npm.cmd run blog` depois
 * de mexer no conteúdo.
 *
 * A montagem do HTML vive em blog-render.mjs, compartilhada com api/artigo.js.
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { artigos } from './blog-artigos.mjs';
import { paginaArtigo, paginaIndice } from './blog-render.mjs';

const raiz = new URL('../blog/', import.meta.url);

await rm(raiz, { recursive: true, force: true });
await mkdir(raiz, { recursive: true });

const ordenados = [...artigos].sort((a, b) => b.data.localeCompare(a.data));

await writeFile(new URL('index.html', raiz), paginaIndice(ordenados), 'utf8');

for (const artigo of ordenados) {
  const relacionados = ordenados.filter((outro) => outro.slug !== artigo.slug).slice(0, 2);
  await mkdir(new URL(`${artigo.slug}/`, raiz), { recursive: true });
  await writeFile(new URL(`${artigo.slug}/index.html`, raiz), paginaArtigo(artigo, relacionados), 'utf8');
}

console.log(`Blog gerado: 1 índice + ${ordenados.length} artigos em blog/.`);
