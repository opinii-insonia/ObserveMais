import { appendFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import crypto from 'node:crypto';
import { put } from '@vercel/blob';

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

    const record = {
      id: crypto.randomUUID(),
      source: cleanText(payload?.source) || 'observall-site-roi',
      origem: cleanText(payload?.origem),
      createdAt: new Date().toISOString(),
      lead,
      simulation: payload?.simulation || {},
      client: {
        ipHash: crypto.createHash('sha256').update(request.headers['x-forwarded-for'] || '').digest('hex'),
        userAgent: String(request.headers['user-agent'] || '').slice(0, 240),
      },
    };

    const line = `${JSON.stringify(record)}\n`;
    let storage = 'temporary';

    try {
      await put(`roi-leads/${record.createdAt.slice(0, 10)}/${record.id}.json`, JSON.stringify(record, null, 2), {
        access: 'private',
        contentType: 'application/json',
      });
      storage = 'blob';
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

    response.status(200).json({ ok: true, storage, sheet });
  } catch (error) {
    response.status(400).json({ ok: false, error: 'invalid_payload' });
  }
}
