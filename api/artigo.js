/**
 * Renderiza os artigos publicados pelo painel em /blog/<slug>.
 *
 * Os artigos versionados em blog/ são arquivos estáticos e a Vercel os serve
 * antes de chegar aqui. Esta função só recebe os slugs que não têm arquivo —
 * ou seja, os que foram publicados pelo painel.
 *
 * A montagem do HTML é a mesma de scripts/blog-render.mjs, então artigo
 * publicado e artigo versionado saem com a mesma página.
 */
import { list } from '@vercel/blob';
import { artigos as versionados } from '../scripts/blog-artigos.mjs';
import { paginaArtigo } from '../scripts/blog-render.mjs';
import { textoParaBlocos } from '../scripts/blog-markdown.mjs';

const PREFIXO = 'blog-artigos/';

export default async function handler(request, response) {
  const url = new URL(request.url, `https://${request.headers.host || 'observemais.com.br'}`);
  const slug = String(url.searchParams.get('slug') || '').replace(/[^a-z0-9-]/g, '');

  response.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (!slug) {
    response.status(404).end('<!doctype html><meta charset="utf-8"><title>Não encontrado</title><p>Artigo não encontrado. <a href="/blog">Voltar ao blog</a>.</p>');
    return;
  }

  try {
    const { blobs } = await list({ prefix: `${PREFIXO}${slug}.json`, limit: 1 });

    if (!blobs[0]) {
      response.setHeader('Cache-Control', 'no-store');
      response.status(404).end('<!doctype html><meta charset="utf-8"><title>Não encontrado</title><p>Artigo não encontrado. <a href="/blog">Voltar ao blog</a>.</p>');
      return;
    }

    const dados = await (await fetch(blobs[0].url)).json();

    const artigo = {
      slug: dados.slug,
      titulo: dados.titulo,
      resumo: dados.resumo,
      categoria: dados.categoria,
      data: dados.data,
      leitura: dados.leitura || '5 min',
      corpo: textoParaBlocos(dados.corpo),
    };

    const relacionados = versionados.slice(0, 2);

    response.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
    response.status(200).end(paginaArtigo(artigo, relacionados));
  } catch (erro) {
    console.error('[artigo] falha:', erro?.message);
    response.setHeader('Cache-Control', 'no-store');
    response.status(500).end('<!doctype html><meta charset="utf-8"><title>Erro</title><p>Não foi possível carregar o artigo agora. <a href="/blog">Voltar ao blog</a>.</p>');
  }
}
