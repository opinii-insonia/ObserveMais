/**
 * Gera o índice do blog a partir de scripts/blog-artigos.mjs.
 *
 * As páginas de artigo NÃO são geradas aqui. Todas passam por api/artigo.js,
 * porque a Vercel serve arquivo estático antes de chamar função — e enquanto os
 * artigos do código eram arquivos, o painel não conseguia tirá-los do ar.
 *
 * Rode `npm.cmd run blog` depois de mexer no conteúdo.
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { artigos } from './blog-artigos.mjs';
import { paginaIndice } from './blog-render.mjs';

const raiz = new URL('../blog/', import.meta.url);

await rm(raiz, { recursive: true, force: true });
await mkdir(raiz, { recursive: true });

const ordenados = [...artigos].sort((a, b) => b.data.localeCompare(a.data));

await writeFile(new URL('index.html', raiz), paginaIndice(ordenados), 'utf8');

console.log(`Blog gerado: índice com ${ordenados.length} artigos. As páginas são servidas por api/artigo.js.`);
