import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { avaliarDiagnostico, emailCorporativo } from '../api/lead-capture.js';

const root = normalize(new URL('../', import.meta.url).pathname.replace(/^\/(.:)/, '$1'));
const port = Number(process.env.PORT || 4173);
const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

async function readRequestBody(request, limit = 20000) {
  let body = '';

  for await (const chunk of request) {
    body += chunk;
    if (body.length > limit) throw new Error('request_too_large');
  }

  return body;
}

async function captureLead(request, response) {
  try {
    const body = await readRequestBody(request);
    const payload = JSON.parse(body);
    const lead = payload?.lead || {};

    if (!lead.nome || !lead.empresa || !lead.whatsapp || !lead.email) {
      response.writeHead(422, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ ok: false, error: 'missing_lead_fields' }));
      return;
    }

    // Mesma regra da função de produção, importada em vez de copiada: assim o
    // smoke local exercita a decisão real, sem repetir o critério aqui.
    const diagnostico = payload?.tipo === 'diagnostico-gratuito';
    if (diagnostico && !emailCorporativo(lead.email)) {
      response.writeHead(422, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ ok: false, error: 'email_nao_corporativo' }));
      return;
    }

    const resposta = { ok: true, storage: 'local-dev' };
    if (diagnostico) resposta.qualificado = avaliarDiagnostico(payload?.qualificacao || {}).qualificado;

    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify(resposta));
  } catch (error) {
    response.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ ok: false, error: 'invalid_payload' }));
  }
}

createServer((request, response) => {
  const requestPath = decodeURIComponent(request.url?.split('?')[0] || '/');

  if (request.method === 'POST' && requestPath === '/api/lead-capture') {
    captureLead(request, response);
    return;
  }

  const requestedFile = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
  let file = normalize(join(root, requestedFile));

  if (!file.startsWith(root) || !existsSync(file)) {
    response.writeHead(404).end('Not found');
    return;
  }

  // Diretório serve o index.html de dentro, como a Vercel faz com /restaurantes.
  if (statSync(file).isDirectory()) {
    file = join(file, 'index.html');
    if (!existsSync(file)) {
      response.writeHead(404).end('Not found');
      return;
    }
  }

  response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`Observe Mais disponível em http://127.0.0.1:${port}`);
});
