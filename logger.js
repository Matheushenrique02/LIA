const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
// ----------------------------------- //

// Criação de LOG (Erro Tecnico)
const filePath = path.join(__dirname, 'logs.xlsx');

async function logError(error, context = '') {
  const workbook = new ExcelJS.Workbook();

  if (fs.existsSync(filePath)) {
    await workbook.xlsx.readFile(filePath);
  }

  let sheet = workbook.getWorksheet('Logs');

  if (!sheet) {
    sheet = workbook.addWorksheet('Logs');

    sheet.columns = [
      { header: 'Data', key: 'date', width: 25 },
      { header: 'Erro', key: 'error', width: 70 },
      { header: 'Contexto', key: 'context', width: 70 },
    ];
  }

  sheet.addRow({
    date: new Date().toISOString(),
    error: error?.stack || error?.message || String(error),
    context
  });

  await workbook.xlsx.writeFile(filePath).catch(console.error);
}
// ----------------------------------- //

// Criação de LOG (Erro Resposta IA)
async function logIA(tipo, pergunta, usuario) {
  const workbook = new ExcelJS.Workbook();

  if (fs.existsSync(filePath)) {
    await workbook.xlsx.readFile(filePath);
  }

let sheet = workbook.getWorksheet('Interacoes_IA');

  if (!sheet) {
    sheet = workbook.addWorksheet('Interacoes_IA');

    sheet.columns = [
      { header: 'Data', key: 'date', width: 25 },
      { header: 'Tipo', key: 'type', width: 20 },
      { header: 'Pergunta', key: 'question', width: 70 },
      { header: 'Usuário', key: 'user', width: 30 },
    ];
  }

  sheet.addRow({
    date: new Date().toISOString(),
    type: tipo,
    question: pergunta,
    user: usuario
  });

  await workbook.xlsx.writeFile(filePath).catch(console.error);
}
module.exports = { logError, logIA };