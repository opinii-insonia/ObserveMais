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
const ABA_DIAGNOSTICO = 'Diagnóstico gratuito';

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

// Cadastros do diagnóstico gratuito: todos entram, com a coluna Qualificado
// dizendo quem tem o perfil (Brasília/DF e 4 ou mais unidades).
const COLUNAS_DIAGNOSTICO = [
  'Recebido em',
  'Qualificado',
  'Motivo',
  'Nome',
  'Empresa',
  'Cargo',
  'E-mail',
  'WhatsApp',
  'Segmento',
  'Localização',
  'Cidade',
  'Unidades',
  'Fonte',
  'ID',
];

function doPost(e) {
  try {
    const dados = JSON.parse(e.postData.contents);

    if (dados.segredo !== SEGREDO) {
      return resposta({ ok: false, erro: 'nao_autorizado' });
    }

    if (dados.tipo === 'diagnostico-gratuito') {
      obterAba(ABA_DIAGNOSTICO, COLUNAS_DIAGNOSTICO).appendRow([
        formatarData(dados.recebidoEm),
        dados.qualificado || '',
        dados.motivo || '',
        dados.nome || '',
        dados.empresa || '',
        dados.cargo || '',
        dados.email || '',
        dados.whatsapp || '',
        dados.segmento || '',
        dados.localizacao || '',
        dados.cidade || '',
        dados.unidades || '',
        dados.fonte || '',
        dados.id || '',
      ]);
      return resposta({ ok: true });
    }

    const aba = obterAba(ABA, COLUNAS);

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

function obterAba(nome, colunas) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  let aba = planilha.getSheetByName(nome);

  if (!aba) {
    aba = planilha.insertSheet(nome);
  }

  // Cria o cabeçalho na primeira execução.
  if (aba.getLastRow() === 0) {
    aba.appendRow(colunas);
    aba.getRange(1, 1, 1, colunas.length).setFontWeight('bold');
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
