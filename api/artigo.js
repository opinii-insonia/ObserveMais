/**
 * Serve qualquer artigo do blog em /blog/<slug>.
 *
 * POR QUE TODOS PASSAM POR AQUI
 *
 * Antes, os artigos versionados eram arquivos estáticos em blog/<slug>/. A Vercel
 * serve arquivo antes de chamar função, então o painel não tinha como tirá-los do
 * ar — só conseguia apagar o que ele mesmo havia publicado.
 *
 * Com todos passando por esta rota, remover funciona igual para os dois casos. O
 * conteúdo versionado continua vindo do código, não do armazenamento: se o Blob
 * estiver fora, os seis artigos originais seguem no ar.
 */
import { list } from '@vercel/blob';
import { artigos as versionados } from '../scripts/blog-artigos.mjs';
import { paginaArtigo } from '../scripts/blog-render.mjs';
import { textoParaBlocos } from '../scripts/blog-markdown.mjs';

const PREFIXO = 'blog-artigos/';
const OCULTOS = 'blog-config/ocultos.json';

const naoEncontrado =
  '<!doctype html><meta charset="utf-8"><title>Não encontrado</title><p>Artigo não encontrado. <a href="/blog">Voltar ao blog</a>.</p>';

/**
 * Slugs que o painel escondeu.
 *
 * Falha aberta de propósito: se o armazenamento não responder, é melhor mostrar o
 * artigo do que derrubar o blog inteiro.
 */
export async function lerOcultos() {
  try {
    const { blobs } = await list({ prefix: OCULTOS, limit: 1 });
    if (!blobs[0]) return [];

    const resposta = await fetch(blobs[0].url);
    if (!resposta.ok) return [];

    const dados = await resposta.json();
    return Array.isArray(dados?.slugs) ? dados.slugs : [];
  } catch {
    return [];
  }
}

async function buscarPublicado(slug) {
  const { blobs } = await list({ prefix: `${PREFIXO}${slug}.json`, limit: 1 });
  if (!blobs[0]) return null;

  const resposta = await fetch(blobs[0].url);
  if (!resposta.ok) return null;

  const dados = await resposta.json();

  return {
    slug: dados.slug,
    titulo: dados.titulo,
    resumo: dados.resumo,
    categoria: dados.categoria,
    data: dados.data,
    leitura: dados.leitura || '5 min',
    capa: dados.capa || '',
    capaAlt: dados.capaAlt || dados.titulo,
    // O texto do painel vira blocos aqui; a conversão escapa todo HTML digitado.
    corpo: textoParaBlocos(dados.corpo),
  };
}

export default async function handler(request, response) {
  const url = new URL(request.url, `https://${request.headers.host || 'observemais.com.br'}`);
  const slug = String(url.searchParams.get('slug') || '').replace(/[^a-z0-9-]/g, '');

  response.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (!slug) {
    response.setHeader('Cache-Control', 'no-store');
    response.status(404).end(naoEncontrado);
    return;
  }

  try {
    const ocultos = await lerOcultos();

    if (ocultos.includes(slug)) {
      response.setHeader('Cache-Control', 'no-store');
      response.status(404).end(naoEncontrado);
      return;
    }

    let artigo = null;

    try {
      artigo = await buscarPublicado(slug);
    } catch (erro) {
      // Armazenamento fora do ar não pode esconder o que vem do código.
      console.error('[artigo] armazenamento indisponível:', erro?.message);
    }

    if (!artigo) artigo = versionados.find((a) => a.slug === slug) || null;

    if (!artigo) {
      response.setHeader('Cache-Control', 'no-store');
      response.status(404).end(naoEncontrado);
      return;
    }

    const relacionados = versionados.filter((a) => a.slug !== slug && !ocultos.includes(a.slug)).slice(0, 2);

    response.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
    response.status(200).end(paginaArtigo(artigo, relacionados));
  } catch (erro) {
    console.error('[artigo] falha:', erro?.message);
    response.setHeader('Cache-Control', 'no-store');
    response.status(500).end(
      '<!doctype html><meta charset="utf-8"><title>Erro</title><p>Não foi possível carregar o artigo agora. <a href="/blog">Voltar ao blog</a>.</p>',
    );
  }
}
