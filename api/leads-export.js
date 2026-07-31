import { get, list } from '@vercel/blob';

function isAuthorized(request) {
  const expected = process.env.ROI_LEADS_TOKEN;
  if (!expected) return false;

  const url = new URL(request.url, `https://${request.headers.host || 'observall.com.br'}`);
  const provided = request.headers['x-leads-token'] || url.searchParams.get('token');
  return provided === expected;
}

async function streamToText(stream) {
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString('utf8');
}

function csvEscape(value) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
}

function formatCurrency(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(number);
}

function formatPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '';

  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(number)}%`;
}

function toCsv(records) {
  const headers = [
    'createdAt',
    'nome',
    'empresa',
    'whatsapp',
    'email',
    'quantidadeDeLojas',
    'cuponsPorMes',
    'ticketMedio',
    'margemDeLucro',
    'visitasOcultasPorLojaMes',
    'receitaExtraMensal',
    'lucroIncrementalMensal',
    'investimentoMensalObservall',
    'roiAnual',
    'ganhoLiquidoAnual',
  ];

  const rows = records.map((record) => {
    const simulation = record.simulation || {};
    const lead = record.lead || {};

    return [
      record.createdAt,
      lead.nome,
      lead.empresa,
      lead.whatsapp,
      lead.email,
      simulation.quantidadeDeLojas,
      simulation.cuponsPorMes,
      simulation.ticketMedio,
      simulation.margemDeLucro,
      simulation.visitasOcultasPorLojaMes,
      simulation.receitaExtraMensal,
      simulation.lucroIncrementalMensal,
      simulation.investimentoMensalObservall,
      simulation.roiAnual,
      simulation.ganhoLiquidoAnual,
    ].map(csvEscape).join(',');
  });

  return `${headers.join(',')}\n${rows.join('\n')}\n`;
}

function linkForFormat(url, format) {
  const nextUrl = new URL(url);
  nextUrl.searchParams.set('format', format);
  return `${nextUrl.pathname}${nextUrl.search}`;
}

function renderHtml(records, url) {
  const rows = records.map((record) => {
    const lead = record.lead || {};
    const simulation = record.simulation || {};

    return `
      <tr>
        <td>${escapeHtml(formatDate(record.createdAt))}</td>
        <td><strong>${escapeHtml(lead.nome)}</strong></td>
        <td>${escapeHtml(lead.empresa)}</td>
        <td>${escapeHtml(lead.whatsapp)}</td>
        <td>${escapeHtml(lead.email)}</td>
        <td>${escapeHtml(simulation.quantidadeDeLojas)}</td>
        <td>${escapeHtml(simulation.cuponsPorMes)}</td>
        <td>${escapeHtml(formatCurrency(simulation.ticketMedio))}</td>
        <td>${escapeHtml(formatPercent(simulation.margemDeLucro))}</td>
        <td>${escapeHtml(simulation.visitasOcultasPorLojaMes)}</td>
        <td>${escapeHtml(formatCurrency(simulation.receitaExtraMensal))}</td>
        <td>${escapeHtml(formatCurrency(simulation.lucroIncrementalMensal))}</td>
        <td>${escapeHtml(formatCurrency(simulation.investimentoMensalObservall))}</td>
        <td>${escapeHtml(formatPercent(simulation.roiAnual))}</td>
        <td>${escapeHtml(formatCurrency(simulation.ganhoLiquidoAnual))}</td>
      </tr>
    `;
  }).join('');

  const emptyState = records.length
    ? ''
    : '<tr><td colspan="15" class="empty">Nenhum lead encontrado ainda.</td></tr>';

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Leads ROI Observe Mais</title>
  <style>
    :root {
      color-scheme: light;
      --green: #00bf63;
      --green-dark: #008f4a;
      --ink: #111418;
      --muted: #68707d;
      --line: #e3e8ef;
      --surface: #ffffff;
      --soft: #f5f8f6;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      background: #f3f5f4;
      color: var(--ink);
      font: 15px/1.45 Arial, Helvetica, sans-serif;
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 24px clamp(18px, 4vw, 48px);
      background: var(--surface);
      border-bottom: 1px solid var(--line);
      position: sticky;
      top: 0;
      z-index: 2;
    }

    h1 {
      margin: 0;
      font-size: clamp(24px, 3vw, 36px);
      line-height: 1.05;
      letter-spacing: 0;
    }

    .summary {
      margin: 6px 0 0;
      color: var(--muted);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: flex-end;
    }

    a.button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 42px;
      padding: 0 16px;
      border-radius: 8px;
      border: 1px solid var(--line);
      color: var(--ink);
      font-weight: 700;
      text-decoration: none;
      white-space: nowrap;
    }

    a.button.primary {
      border-color: var(--green);
      background: var(--green);
      color: #fff;
    }

    main {
      padding: 24px clamp(12px, 4vw, 48px) 48px;
    }

    .table-wrap {
      overflow: auto;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: 0 20px 50px rgba(10, 20, 15, 0.08);
    }

    table {
      width: 100%;
      min-width: 1480px;
      border-collapse: collapse;
    }

    th,
    td {
      padding: 13px 14px;
      border-bottom: 1px solid var(--line);
      text-align: left;
      vertical-align: top;
      white-space: nowrap;
    }

    th {
      background: var(--soft);
      color: var(--green-dark);
      font-size: 12px;
      letter-spacing: 0;
      text-transform: uppercase;
      position: sticky;
      top: 91px;
      z-index: 1;
    }

    tr:last-child td { border-bottom: 0; }

    .empty {
      padding: 42px 18px;
      color: var(--muted);
      text-align: center;
      white-space: normal;
    }

    @media (max-width: 760px) {
      header {
        align-items: flex-start;
        flex-direction: column;
        position: static;
      }

      .actions {
        justify-content: flex-start;
        width: 100%;
      }

      a.button {
        flex: 1 1 150px;
      }

      th { top: 0; }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Leads da calculadora ROI</h1>
      <p class="summary">${records.length} lead${records.length === 1 ? '' : 's'} encontrado${records.length === 1 ? '' : 's'}</p>
    </div>
    <nav class="actions" aria-label="Exportar leads">
      <a class="button primary" href="${escapeHtml(linkForFormat(url, 'csv'))}">Baixar CSV</a>
      <a class="button" href="${escapeHtml(linkForFormat(url, 'json'))}">Ver JSON</a>
    </nav>
  </header>
  <main>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Nome</th>
            <th>Empresa</th>
            <th>WhatsApp</th>
            <th>E-mail</th>
            <th>Lojas</th>
            <th>Cupons/mes</th>
            <th>Ticket</th>
            <th>Margem</th>
            <th>Visitas</th>
            <th>Receita extra</th>
            <th>Lucro mensal</th>
            <th>Investimento</th>
            <th>ROI anual</th>
            <th>Ganho anual</th>
          </tr>
        </thead>
        <tbody>${rows || emptyState}</tbody>
      </table>
    </div>
  </main>
</body>
</html>`;
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'GET') {
    response.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  if (!process.env.ROI_LEADS_TOKEN) {
    response.status(501).json({ ok: false, error: 'missing_ROI_LEADS_TOKEN' });
    return;
  }

  if (!isAuthorized(request)) {
    response.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }

  try {
    const url = new URL(request.url, `https://${request.headers.host || 'observall.com.br'}`);
    const format = url.searchParams.get('format');
    const records = [];
    let cursor;

    do {
      const page = await list({ prefix: 'roi-leads/', cursor, limit: 1000 });
      cursor = page.cursor;

      for (const blob of page.blobs) {
        const result = await get(blob.pathname, { access: 'private' });
        if (result?.statusCode !== 200 || !result.stream) continue;
        records.push(JSON.parse(await streamToText(result.stream)));
      }
    } while (cursor);

    records.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

    if (format === 'csv') {
      response.setHeader('Content-Type', 'text/csv; charset=utf-8');
      response.setHeader('Content-Disposition', 'attachment; filename="observall-roi-leads.csv"');
      response.status(200).send(toCsv(records));
      return;
    }

    if (format === 'json') {
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      response.status(200).json({ ok: true, count: records.length, leads: records });
      return;
    }

    response.setHeader('X-Robots-Tag', 'noindex');
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.status(200).send(renderHtml(records, url));
  } catch (error) {
    response.status(500).json({ ok: false, error: 'export_failed' });
  }
}
