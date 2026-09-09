/**
 * Painel de publicação do blog.
 *
 * SEGURANÇA — o que sustenta este endpoint:
 *
 * 1. A senha vive apenas em BLOG_ADMIN_SENHA, variável de ambiente da Vercel.
 *    Ela nunca entra no repositório, no HTML nem no JavaScript que o navegador
 *    baixa. Não existe forma de proteger isso num site estático sem uma variável
 *    de ambiente: qualquer senha no frontend é legível por quem abrir o código.
 *
 * 2. A comparação da senha é feita em tempo constante. Comparar com `===`
 *    permitiria descobrir a senha caractere a caractere medindo o tempo de
 *    resposta.
 *
 * 3. O login devolve um token assinado com HMAC-SHA256 e prazo de validade.
 *    O token não guarda a senha e não é reutilizável depois do vencimento.
 *
 * 4. Tentativas de login erradas respondem com atraso, para encarecer a
 *    tentativa de força bruta.
 */
import crypto from 'node:crypto';
import { list, put, del } from '@vercel/blob';

const PREFIXO = 'blog-artigos/';
const VALIDADE_HORAS = 8;
const TAMANHO_MAXIMO = 200000;

function lerCorpo(request) {
  return new Promise((resolve, reject) => {
    let corpo = '';
    request.on('data', (parte) => {
      corpo += parte;
      if (corpo.length > TAMANHO_MAXIMO) reject(new Error('corpo_muito_grande'));
    });
    request.on('end', () => resolve(corpo));
    request.on('error', reject);
  });
}

function comparaSegura(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  // timingSafeEqual exige mesmo tamanho; o hash iguala o comprimento sem vazar o original.
  const hashA = crypto.createHash('sha256').update(bufA).digest();
  const hashB = crypto.createHash('sha256').update(bufB).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function segredoDeAssinatura() {
  // Sem segredo dedicado, deriva da própria senha: continua fora do repositório.
  return process.env.BLOG_ADMIN_SEGREDO || `derivado:${process.env.BLOG_ADMIN_SENHA || ''}`;
}

function criarToken() {
  const expiraEm = Date.now() + VALIDADE_HORAS * 60 * 60 * 1000;
  const dados = `${expiraEm}`;
  const assinatura = crypto.createHmac('sha256', segredoDeAssinatura()).update(dados).digest('hex');
  return `${dados}.${assinatura}`;
}

function tokenValido(token) {
  if (typeof token !== 'string' || !token.includes('.')) return false;

  const [dados, assinatura] = token.split('.');
  const esperada = crypto.createHmac('sha256', segredoDeAssinatura()).update(dados).digest('hex');

  if (!assinatura || assinatura.length !== esperada.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(assinatura), Buffer.from(esperada))) return false;

  return Number(dados) > Date.now();
}

function limpar(valor, limite = 220) {
  return String(valor || '').trim().slice(0, limite);
}

function gerarSlug(titulo) {
  return limpar(titulo, 90)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function listarArtigos() {
  const { blobs } = await list({ prefix: PREFIXO, limit: 1000 });
  const artigos = [];

  for (const blob of blobs) {
    try {
      const resposta = await fetch(blob.url);
      if (resposta.ok) artigos.push(await resposta.json());
    } catch {
      // Um artigo ilegível não pode derrubar a listagem inteira.
    }
  }

  return artigos.sort((a, b) => String(b.data).localeCompare(String(a.data)));
}

export default async function handler(request, response) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');

  const senhaConfigurada = process.env.BLOG_ADMIN_SENHA;
  if (!senhaConfigurada) {
    response.status(503).json({ ok: false, erro: 'painel_nao_configurado' });
    return;
  }

  if (request.method !== 'POST') {
    response.status(405).json({ ok: false, erro: 'metodo_nao_permitido' });
    return;
  }

  let dados;
  try {
    dados = JSON.parse(await lerCorpo(request));
  } catch {
    response.status(400).json({ ok: false, erro: 'payload_invalido' });
    return;
  }

  const acao = limpar(dados?.acao, 20);

  if (acao === 'login') {
    if (!comparaSegura(dados?.senha, senhaConfigurada)) {
      // Atraso fixo encarece a tentativa em massa sem revelar nada sobre a senha.
      await new Promise((r) => setTimeout(r, 1200));
      response.status(401).json({ ok: false, erro: 'senha_invalida' });
      return;
    }

    response.status(200).json({ ok: true, token: criarToken(), validadeHoras: VALIDADE_HORAS });
    return;
  }

  // Daqui para baixo, tudo exige sessão válida.
  if (!tokenValido(dados?.token)) {
    response.status(401).json({ ok: false, erro: 'sessao_expirada' });
    return;
  }

  try {
    if (acao === 'listar') {
      response.status(200).json({ ok: true, artigos: await listarArtigos() });
      return;
    }

    if (acao === 'publicar') {
      const titulo = limpar(dados?.titulo, 160);
      const resumo = limpar(dados?.resumo, 320);
      const categoria = limpar(dados?.categoria, 40) || 'Cliente oculto';
      const corpo = String(dados?.corpo || '').trim().slice(0, 60000);
      const slug = gerarSlug(dados?.slug || titulo);

      if (!titulo || !resumo || !corpo || !slug) {
        response.status(422).json({ ok: false, erro: 'campos_obrigatorios' });
        return;
      }

      const artigo = {
        slug,
        titulo,
        resumo,
        categoria,
        corpo,
        data: limpar(dados?.data, 10) || new Date().toISOString().slice(0, 10),
        leitura: `${Math.max(1, Math.round(corpo.split(/\s+/).length / 200))} min`,
        publicadoEm: new Date().toISOString(),
      };

      await put(`${PREFIXO}${slug}.json`, JSON.stringify(artigo, null, 2), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
      });

      response.status(200).json({ ok: true, slug, url: `/blog/${slug}` });
      return;
    }

    if (acao === 'remover') {
      const slug = gerarSlug(dados?.slug);
      if (!slug) {
        response.status(422).json({ ok: false, erro: 'slug_obrigatorio' });
        return;
      }

      const { blobs } = await list({ prefix: `${PREFIXO}${slug}.json`, limit: 1 });
      if (blobs[0]) await del(blobs[0].url);

      response.status(200).json({ ok: true });
      return;
    }

    response.status(400).json({ ok: false, erro: 'acao_desconhecida' });
  } catch (erro) {
    console.error('[blog-admin] falha:', erro?.message);
    response.status(500).json({ ok: false, erro: 'falha_no_armazenamento' });
  }
}
