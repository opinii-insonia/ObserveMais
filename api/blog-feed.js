/**
 * Lista pública dos artigos publicados pelo painel.
 *
 * Só devolve o que já está publicado — não há segredo nem token aqui, e é isso
 * que permite ao índice estático do blog completar a grade com os artigos novos.
 */
import { list } from '@vercel/blob';

const PREFIXO = 'blog-artigos/';

export default async function handler(request, response) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  // Cache curto: publicação nova aparece rápido sem bater no Blob a cada visita.
  response.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');

  try {
    const { blobs } = await list({ prefix: PREFIXO, limit: 1000 });
    const artigos = [];

    for (const blob of blobs) {
      try {
        const resposta = await fetch(blob.url);
        if (!resposta.ok) continue;
        const artigo = await resposta.json();
        // O corpo não vai no feed: o índice só precisa do cartão.
        artigos.push({
          slug: artigo.slug,
          titulo: artigo.titulo,
          resumo: artigo.resumo,
          categoria: artigo.categoria,
          data: artigo.data,
          leitura: artigo.leitura,
        });
      } catch {
        // Artigo ilegível é ignorado, não derruba o feed.
      }
    }

    artigos.sort((a, b) => String(b.data).localeCompare(String(a.data)));
    response.status(200).json({ ok: true, artigos });
  } catch (erro) {
    console.error('[blog-feed] falha:', erro?.message);
    // Sem Blob configurado o blog segue funcionando com os artigos versionados.
    response.status(200).json({ ok: true, artigos: [] });
  }
}
