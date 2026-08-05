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
    };

    if (!lead.nome || !lead.empresa || !lead.whatsapp || !lead.email) {
      response.status(422).json({ ok: false, error: 'missing_lead_fields' });
      return;
    }

    const record = {
      id: crypto.randomUUID(),
      source: 'observall-site-roi',
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

    response.status(200).json({ ok: true, storage });
  } catch (error) {
    response.status(400).json({ ok: false, error: 'invalid_payload' });
  }
}
