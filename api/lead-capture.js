import { appendFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import crypto from 'node:crypto';
import { put } from '@vercel/blob';
import { cifrar, cofreAtivo } from './_leads-cofre.js';

const MAX_BODY_SIZE = 20000;

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY_SIZE) {
        reject(new Error('request_too_large'));
      }
    });

    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function cleanText(value) {
  return String(value || '').trim().slice(0, 180);
}

/**
 * Regra do diagnóstico gratuito: todo mundo é cadastrado, mas só é aprovado
 * quem tem unidades em Brasília/DF e ao menos UNIDADES_MINIMAS unidades.
 *
 * A regra vive só aqui, no servidor. O navegador não a conhece: ele apenas
 * mostra o painel que esta resposta indicar. É isso que impede o critério de
 * aparecer para quem preenche o formulário, inclusive no código da página.
 */
const DIAGNOSTICO_REGIAO = 'df';
const DIAGNOSTICO_UNIDADES_MINIMAS = 2;
const LOCALIZACOES = ['df', 'entorno', 'outra'];

/**
 * O diagnóstico é para operações, então o cadastro exige e-mail corporativo.
 * A lista cobre os provedores pessoais usados no Brasil; o que não estiver
 * nela é tratado como domínio próprio da empresa.
 *
 * site.js repete esta lista para avisar o visitante antes do envio; aqui a
 * recusa é aplicada de verdade.
 */
const DOMINIOS_PESSOAIS = new Set([
  'gmail.com', 'googlemail.com',
  'hotmail.com', 'hotmail.com.br', 'outlook.com', 'outlook.com.br', 'live.com', 'live.com.br', 'msn.com',
  'yahoo.com', 'yahoo.com.br', 'ymail.com',
  'icloud.com', 'me.com', 'mac.com', 'aol.com',
  'proton.me', 'protonmail.com', 'tutanota.com', 'gmx.com', 'mail.com', 'yandex.com', 'zoho.com', 'hey.com',
  'bol.com.br', 'uol.com.br', 'terra.com.br', 'ig.com.br', 'globo.com', 'globomail.com', 'r7.com',
  'zipmail.com.br', 'oi.com.br', 'superig.com.br', 'pop.com.br', 'click21.com.br', 'itelefonica.com.br',
]);

export function emailCorporativo(email) {
  const dominio = String(email || '').trim().toLowerCase().split('@')[1];
  if (!dominio || !dominio.includes('.')) return false;
  return !DOMINIOS_PESSOAIS.has(dominio);
}

export function avaliarDiagnostico({ localizacao, unidades }) {
  const naRegiao = localizacao === DIAGNOSTICO_REGIAO;
  const porteOk = Number(unidades) >= DIAGNOSTICO_UNIDADES_MINIMAS;
  const motivos = [];
  if (!naRegiao) motivos.push('fora de Brasília/DF');
  if (!porteOk) motivos.push(`menos de ${DIAGNOSTICO_UNIDADES_MINIMAS} unidades`);
  return { qualificado: naRegiao && porteOk, motivo: motivos.join(' e ') || 'perfil atendido' };
}

function lerQualificacao(bruto) {
  if (!bruto || typeof bruto !== 'object') return null;

  const unidades = Number.parseInt(bruto.unidades, 10);
  const qualificacao = {
    segmento: cleanText(bruto.segmento),
    localizacao: LOCALIZACOES.includes(bruto.localizacao) ? bruto.localizacao : 'outra',
    cidade: cleanText(bruto.cidade),
    unidades: Number.isFinite(unidades) && unidades > 0 ? Math.min(unidades, 5000) : 0,
  };

  return { ...qualificacao, ...avaliarDiagnostico(qualificacao) };
}

/**
 * Envia o lead para a planilha do Google.
 *
 * A gravação é feita por um Web App do Apps Script vinculado à planilha, cuja URL
 * fica em SHEETS_WEBHOOK_URL. Assim nenhuma credencial do Google entra no repositório
 * nem no navegador, e o projeto segue sem dependências extras.
 *
 * O envio nunca derruba a captura: se a planilha falhar, o lead já está no Blob.
 */
async function enviarParaPlanilha(record) {
  const webhook = process.env.SHEETS_WEBHOOK_URL;
  if (!webhook) return 'nao_configurado';

  try {
    const resposta = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        segredo: process.env.SHEETS_WEBHOOK_SECRET || '',
        id: record.id,
        recebidoEm: record.createdAt,
        nome: record.lead.nome,
        empresa: record.lead.empresa,
        cargo: record.lead.cargo,
        email: record.lead.email,
        whatsapp: record.lead.whatsapp,
        origem: record.origem,
        fonte: record.source,
        // Diagnóstico gratuito: o Apps Script grava estes campos em aba própria.
        tipo: record.tipo,
        segmento: record.qualificacao?.segmento || '',
        localizacao: record.qualificacao?.localizacao || '',
        cidade: record.qualificacao?.cidade || '',
        unidades: record.qualificacao?.unidades ?? '',
        qualificado: record.qualificacao ? (record.qualificacao.qualificado ? 'sim' : 'não') : '',
        motivo: record.qualificacao?.motivo || '',
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!resposta.ok) throw new Error(`webhook respondeu ${resposta.status}`);

    // Conferir só o status HTTP não basta: o Apps Script responde 200 mesmo
    // quando recusa (segredo errado devolve {ok:false}; implantação restrita
    // devolve a página de login em HTML). Por isso o corpo é inspecionado.
    const corpo = await resposta.text();
    let dados;
    try {
      dados = JSON.parse(corpo);
    } catch {
      throw new Error('webhook respondeu algo que não é JSON (se for Apps Script, a implantação não está como "qualquer pessoa")');
    }

    // Aceita os dois destinos suportados: Apps Script devolve {ok:true},
    // o Catch Hook do Zapier devolve {status:"success"}.
    const gravou = dados?.ok === true || dados?.status === 'success';
    if (!gravou) throw new Error(`webhook recusou: ${dados?.erro || dados?.status || 'motivo não informado'}`);
    return 'ok';
  } catch (error) {
    console.error('[lead-capture] falha ao gravar na planilha:', error?.message);
    return 'falhou';
  }
}

export default async function handler(request, response) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'POST') {
    response.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  try {
    const payload = JSON.parse(await readBody(request));
    const lead = {
      nome: cleanText(payload?.lead?.nome),
      empresa: cleanText(payload?.lead?.empresa),
      whatsapp: cleanText(payload?.lead?.whatsapp),
      email: cleanText(payload?.lead?.email),
      cargo: cleanText(payload?.lead?.cargo),
    };

    if (!lead.nome || !lead.empresa || !lead.whatsapp || !lead.email) {
      response.status(422).json({ ok: false, error: 'missing_lead_fields' });
      return;
    }

    const ehDiagnostico = payload?.tipo === 'diagnostico-gratuito';

    if (ehDiagnostico && !emailCorporativo(lead.email)) {
      response.status(422).json({ ok: false, error: 'email_nao_corporativo' });
      return;
    }

    const qualificacao = ehDiagnostico ? lerQualificacao(payload?.qualificacao) : null;

    const record = {
      id: crypto.randomUUID(),
      source: cleanText(payload?.source) || 'observall-site-roi',
      tipo: qualificacao ? 'diagnostico-gratuito' : 'contato',
      origem: cleanText(payload?.origem),
      pagina: cleanText(payload?.pagina),
      createdAt: new Date().toISOString(),
      lead,
      qualificacao,
      simulation: payload?.simulation || {},
      client: {
        ipHash: crypto.createHash('sha256').update(request.headers['x-forwarded-for'] || '').digest('hex'),
        userAgent: String(request.headers['user-agent'] || '').slice(0, 240),
      },
    };

    const line = `${JSON.stringify(record)}\n`;
    let storage = 'temporary';

    try {
      // O store do projeto é público: o conteúdo vai cifrado, porque lead é dado
      // pessoal e endereço imprevisível não substitui privacidade.
      const { conteudo } = cifrar(record);
      await put(`roi-leads/${record.createdAt.slice(0, 10)}/${record.id}.json`, conteudo, {
        access: 'public',
        contentType: 'application/octet-stream',
      });
      storage = cofreAtivo() ? 'blob' : 'blob-sem-chave';
    } catch (error) {
      // Sem Blob Store conectado o lead cai em disco efêmero da função e se perde no
      // reciclo da instância. O visitante ainda vê sucesso, então o único sinal de que
      // isso está acontecendo é este log e o campo `storage` da resposta.
      console.error('[lead-capture] Blob indisponível, lead em armazenamento temporário:', error?.message);
      const storageDir = join(tmpdir(), 'observall');
      await mkdir(storageDir, { recursive: true });
      await appendFile(join(storageDir, 'roi-leads.jsonl'), line, 'utf8');
    }

    const sheet = await enviarParaPlanilha(record);

    response.status(200).json({
      ok: true,
      storage,
      sheet,
      ...(qualificacao ? { qualificado: qualificacao.qualificado } : {}),
    });
  } catch (error) {
    response.status(400).json({ ok: false, error: 'invalid_payload' });
  }
}
