/**
 * Recebe os leads do site Observe Mais e grava na planilha.
 *
 * COMO INSTALAR
 * 1. Abra a planilha de leads.
 * 2. Extensões > Apps Script. Apague o conteúdo e cole este arquivo.
 * 3. Troque SEGREDO abaixo por uma senha longa e aleatória, e guarde-a.
 * 4. Implantar > Nova implantação > tipo "App da Web".
 *      Executar como .......: Eu
 *      Quem pode acessar ...: Qualquer pessoa
 *    ("Qualquer pessoa" é exigido para a Vercel conseguir chamar. O SEGREDO é o
 *     que de fato protege a gravação.)
 * 5. Copie a URL gerada (termina em /exec).
 * 6. Na Vercel > Settings > Environment Variables, crie:
 *      SHEETS_WEBHOOK_URL    = a URL do passo 5
 *      SHEETS_WEBHOOK_SECRET = o mesmo valor de SEGREDO
 * 7. Redeploy na Vercel para as variáveis valerem.
 */

const SEGREDO = 'troque-por-uma-senha-longa-e-aleatoria';
const ABA = 'Leads';

const COLUNAS = [
  'Recebido em',
  'Nome',
  'Empresa',
  'Cargo',
  'E-mail',
  'WhatsApp',
  'Origem do clique',
  'Fonte',
  'ID',
];

function doPost(e) {
  try {
    const dados = JSON.parse(e.postData.contents);

    if (dados.segredo !== SEGREDO) {
      return resposta({ ok: false, erro: 'nao_autorizado' });
    }

    const aba = obterAba();

    aba.appendRow([
      formatarData(dados.recebidoEm),
      dados.nome || '',
      dados.empresa || '',
      dados.cargo || '',
      dados.email || '',
      dados.whatsapp || '',
      dados.origem || '',
      dados.fonte || '',
      dados.id || '',
    ]);

    return resposta({ ok: true });
  } catch (erro) {
    return resposta({ ok: false, erro: String(erro) });
  }
}

function obterAba() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  let aba = planilha.getSheetByName(ABA);

  if (!aba) {
    aba = planilha.insertSheet(ABA);
  }

  // Cria o cabeçalho na primeira execução.
  if (aba.getLastRow() === 0) {
    aba.appendRow(COLUNAS);
    aba.getRange(1, 1, 1, COLUNAS.length).setFontWeight('bold');
    aba.setFrozenRows(1);
  }

  return aba;
}

function formatarData(iso) {
  if (!iso) return new Date();
  const data = new Date(iso);
  return isNaN(data.getTime()) ? new Date() : data;
}

function resposta(objeto) {
  return ContentService
    .createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}
