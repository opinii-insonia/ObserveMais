/**
 * Lista pública dos artigos publicados pelo painel.
 *
 * Só devolve o que já está publicado — não há segredo nem token aqui, e é isso
 * que permite ao índice estático do blog completar a grade com os artigos novos.
 */
import { list } from '@vercel/blob';
import { lerOcultos } from './artigo.js';

const PREFIXO = 'blog-artigos/';

export default async function handler(request, response) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  // Cache curto: segura a maioria das visitas sem fazer a publicação nova demorar
  // a aparecer. Quem acabou de publicar não espera nem isso — o editor recarrega
  // a grade com um parâmetro único, que o CDN trata como outro recurso.
  response.setHeader('Cache-Control', 'public, max-age=20, s-maxage=20');

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
          capa: artigo.capa || '',
        });
      } catch {
        // Artigo ilegível é ignorado, não derruba o feed.
      }
    }

    const ocultos = await lerOcultos();
    artigos.sort((a, b) => String(b.data).localeCompare(String(a.data)));

    // O índice é estático e já traz os artigos do código; `ocultos` diz quais
    // esconder sem precisar de novo build.
    response.status(200).json({
      ok: true,
      artigos: artigos.filter((a) => !ocultos.includes(a.slug)),
      ocultos,
    });
  } catch (erro) {
    console.error('[blog-feed] falha:', erro?.message);
    // Sem Blob configurado o blog segue funcionando com os artigos versionados.
    response.status(200).json({ ok: true, artigos: [], ocultos: [] });
  }
}
