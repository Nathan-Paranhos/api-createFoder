//apenas para criar um ambiente de teste no meu pc, pode deletar isso dps

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const username = 'paran'; 
const base = path.join('C:', 'Users', username, 'OneDrive - Fagron', 'COM272 - FagronTech - Onboarding', '# Backoffice');

const estrutura = [
  '# BOT Extensão',
  path.join('# BOT Extensão', '#FCERTA EXTENSÃO'),
  path.join('# BOT Extensão', '#PHUSION EXTENSÃO'),
];

const modeloArquivo = path.join(base, '# BOT Extensão', 'Modelo - Fluxo de atendimento BOT Numérico.vsdx');

async function setupEstrutura() {
  try {
    console.log(`ℹ️ Base path: ${base}`);

    // Create directories
    for (const sub of estrutura) {
      const fullPath = path.join(base, sub);
      try {
        await fs.ensureDir(fullPath);
        console.log(`📁 Pasta criada: ${fullPath}`);
      } catch (err) {
        console.error(`❌ Erro ao criar pasta ${fullPath}: ${err.message}`);
        throw err;
      }
    }

    try {
      if (!(await fs.pathExists(modeloArquivo))) {
        await fs.writeFile(modeloArquivo, 'Arquivo modelo de fluxo simulado');
        console.log(`📄 Arquivo criado: ${modeloArquivo}`);
      } else {
        console.log(`📄 Modelo já existe: ${modeloArquivo}`);
      }
    } catch (err) {
      console.error(`❌ Erro ao criar/verificar arquivo ${modeloArquivo}: ${err.message}`);
      throw err;
    }

    console.log('\n✅ Estrutura simulada pronta.');
  } catch (err) {
    console.error(`❌ Erro geral na execução: ${err.message}`);
    process.exit(1);
  }
}
setupEstrutura();