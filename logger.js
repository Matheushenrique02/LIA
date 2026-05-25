const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const filePath = path.join(__dirname, 'logs.xlsx');

// Função interna para garantir que as abas existam
function setupSheets(workbook) {
  let logsSheet = workbook.getWorksheet('Logs');
  if (!logsSheet) {
    logsSheet = workbook.addWorksheet('Logs');
    logsSheet.columns = [
      { header: 'Data', key: 'date', width: 25 },
      { header: 'Erro', key: 'error', width: 70 },
      { header: 'Contexto', key: 'context', width: 50 },
    ];
  }

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
  return { logsSheet, iaSheet };
}

async function saveLog(type, data) {
  const workbook = new ExcelJS.Workbook();
  
  try {
    // 1. Tenta ler o arquivo existente, se não existir, cria um novo
    if (fs.existsSync(filePath)) {
      await workbook.xlsx.readFile(filePath);
    }

    // 2. Garante que as abas e colunas existam
    const { logsSheet, iaSheet } = setupSheets(workbook);

    // 3. Adiciona a linha na aba correta
    if (type === 'error') {
      logsSheet.addRow({
        date: new Date().toLocaleString('pt-BR'), // Data legível
        error: data.error,
        context: data.context
      });
    } else {
      iaSheet.addRow({
        date: new Date().toLocaleString('pt-BR'),
        type: data.tipo,
        question: data.pergunta,
        user: data.usuario
      });
    }

    // 4. Salva o arquivo
    await workbook.xlsx.writeFile(filePath);
  } catch (err) {
    console.error('Erro crítico ao manipular Excel:', err);
  }
}

// Exportações ajustadas para usar a lógica centralizada
const logError = async (error, context = '') => {
  await saveLog('error', {
    error: error?.stack || error?.message || String(error),
    context
  });
};

const logIA = async (tipo, pergunta, usuario) => {
  await saveLog('ia', { tipo, pergunta, usuario });
};

module.exports = { logError, logIA };