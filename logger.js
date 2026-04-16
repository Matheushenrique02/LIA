const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const filePath = path.join(__dirname, 'logs.xlsx');

let workbook = new ExcelJS.Workbook();
let initialized = false;

// Inicializar planilha
async function initWorkbook() {

  if (initialized) return;

  if (fs.existsSync(filePath)) {
    await workbook.xlsx.readFile(filePath);
  }

  // Aba Logs
  let logsSheet = workbook.getWorksheet('Logs');

  if (!logsSheet) {
    logsSheet = workbook.addWorksheet('Logs');

    logsSheet.columns = [
      { header: 'Data', key: 'date', width: 25 },
      { header: 'Erro', key: 'error', width: 70 },
      { header: 'Contexto', key: 'context', width: 50 },
    ];
  }

  // Aba IA
  let iaSheet = workbook.getWorksheet('Interacoes_IA');

  if (!iaSheet) {
    iaSheet = workbook.addWorksheet('Interacoes_IA');

    iaSheet.columns = [
      { header: 'Data', key: 'date', width: 25 },
      { header: 'Tipo', key: 'type', width: 20 },
      { header: 'Pergunta', key: 'question', width: 70 },
      { header: 'Usuário', key: 'user', width: 30 },
    ];
  }

  initialized = true;
}

// Log de erro técnico

async function logError(error, context = '') {

  try {

    await initWorkbook();

    const sheet = workbook.getWorksheet('Logs');

    sheet.addRow({
      date: new Date().toISOString(),
      error: error?.stack || error?.message || String(error),
      context
    });

    await workbook.xlsx.writeFile(filePath);

  } catch (err) {
    console.error('Erro ao salvar log:', err);
  }

}

// Log IA

async function logIA(tipo, pergunta, usuario) {

  try {

    await initWorkbook();

    const sheet = workbook.getWorksheet('Interacoes_IA');

    sheet.addRow({
      date: new Date().toISOString(),
      type: tipo,
      question: pergunta,
      user: usuario
    });

    await workbook.xlsx.writeFile(filePath);

  } catch (err) {
    console.error('Erro ao salvar log IA:', err);
  }

}

// ----------------------------------- //

module.exports = {
  logError,
  logIA
};