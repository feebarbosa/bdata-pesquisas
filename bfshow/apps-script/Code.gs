/**
 * Recebe as entrevistas enviadas pelo app "Pesquisa BFShow" e grava uma
 * linha por entrevista na planilha indicada por SPREADSHEET_ID.
 *
 * Como publicar:
 * 1. Crie uma planilha nova no Google Sheets e copie o ID dela (o trecho
 *    da URL entre /d/ e /edit, ex.: docs.google.com/spreadsheets/d/<ID>/edit).
 * 2. Nela, vá em Extensões > Apps Script.
 * 3. Apague o conteúdo padrão de Code.gs e cole este arquivo inteiro.
 * 4. Substitua o valor de SPREADSHEET_ID abaixo pelo ID copiado no passo 1.
 *    (Usar o ID explícito, em vez de SpreadsheetApp.getActiveSpreadsheet(),
 *    evita o erro "Cannot read properties of null (reading 'getSheetByName')"
 *    que acontece quando o Web App roda sem uma planilha "ativa".)
 * 5. Clique em "Implantar" > "Nova implantação".
 * 6. Tipo: "Aplicativo da Web". Executar como: "Eu". Quem pode acessar:
 *    "Qualquer pessoa".
 * 7. Implante e copie a URL do tipo .../macros/s/XXXXX/exec.
 * 8. Cole essa URL na tela "Ajustes" do app, no campo da URL do Apps Script.
 */

const SPREADSHEET_ID = "14-b4Yeb8nMP48oNF_ARqSGiq4nexQJpzroUbDQP-S5k";
const NOME_ABA = "Respostas";

const COLUNAS = [
  "id",
  "createdAt",
  "nome",
  "cargo",
  "empresa",
  "cidade",
  "uf",
  "perfilEmpresa",
  "perfilEmpresaOutroTexto",
  "qtdLojas",
  "qtdFuncionarios",
  "gargalos",
  "consentimento",
  "contato",
  "temperatura",
  "observacao",
  "recebidoEm",
];

function obterAba() {
  const planilha = SpreadsheetApp.openById(SPREADSHEET_ID);
  let aba = planilha.getSheetByName(NOME_ABA);
  if (!aba) {
    aba = planilha.insertSheet(NOME_ABA);
  }
  if (aba.getRange(1, 1).getValue() !== "id") {
    aba.getRange(1, 1, 1, COLUNAS.length).setValues([COLUNAS]);
    aba.setFrozenRows(1);
  }
  return aba;
}

function doPost(e) {
  try {
    const dados = JSON.parse(e.postData.contents);
    if (!dados || !dados.id) {
      return respostaJSON({ ok: false, erro: "payload sem id" });
    }

    const aba = obterAba();
    const linhaExistente = encontrarLinhaPorId(aba, dados.id);

    const linha = COLUNAS.map((col) => {
      if (col === "recebidoEm") return new Date().toISOString();
      const valor = dados[col];
      return valor === undefined || valor === null ? "" : valor;
    });

    if (linhaExistente > 0) {
      // Upsert: evita duplicar a linha se o app reenviar o mesmo registro
      // (por exemplo, após uma falha de rede no meio do envio).
      aba.getRange(linhaExistente, 1, 1, COLUNAS.length).setValues([linha]);
    } else {
      aba.appendRow(linha);
    }

    return respostaJSON({ ok: true });
  } catch (erro) {
    return respostaJSON({ ok: false, erro: String(erro) });
  }
}

function doGet() {
  return respostaJSON({ ok: true, mensagem: "Apps Script da Pesquisa Feira de Calçados está no ar." });
}

function encontrarLinhaPorId(aba, id) {
  const ultimaLinha = aba.getLastRow();
  if (ultimaLinha < 2) return -1;
  const idsExistentes = aba.getRange(2, 1, ultimaLinha - 1, 1).getValues();
  for (let i = 0; i < idsExistentes.length; i++) {
    if (idsExistentes[i][0] === id) return i + 2;
  }
  return -1;
}

function respostaJSON(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}
