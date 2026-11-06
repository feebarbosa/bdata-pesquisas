// Exportação de backup em CSV (UTF-8 com BOM, aberto corretamente no Excel).

const CSV_COLUNAS = [
  ["id", "ID"],
  ["createdAt", "Data/Hora (Brasília)"],
  ["nome", "Nome do entrevistado"],
  ["cargo", "Cargo"],
  ["empresa", "Empresa"],
  ["cidade", "Cidade"],
  ["uf", "UF"],
  ["perfilEmpresa", "Perfil da empresa"],
  ["perfilEmpresaOutroTexto", "Perfil da empresa (outro - texto)"],
  ["qtdLojas", "Quantas lojas"],
  ["qtdFuncionarios", "Quantos funcionários"],
  ["gargalos", "Maiores problemas"],
  ["consentimento", "Aceitou material gratuito"],
  ["contato", "WhatsApp/e-mail"],
  ["temperatura", "Temperatura do lead"],
  ["observacao", "Observação interna"],
  ["syncStatus", "Status de envio"],
  ["syncedAt", "Enviado em"],
];

function csvEscapar(valor) {
  if (valor === null || valor === undefined) return "";
  const texto = String(valor);
  if (/[",\n;]/.test(texto)) {
    return '"' + texto.replace(/"/g, '""') + '"';
  }
  return texto;
}

function registroParaLinhaCSV(r) {
  return CSV_COLUNAS.map(([chave]) => {
    let v = r[chave];
    if (chave === "gargalos" && Array.isArray(v)) v = v.join(" | ");
    if (chave === "consentimento") v = v ? "Sim" : "Não";
    if (chave === "syncStatus") v = v === "sent" ? "Enviado" : "Pendente";
    return csvEscapar(v);
  }).join(";");
}

function gerarCSV(registros) {
  const cabecalho = CSV_COLUNAS.map(([, titulo]) => csvEscapar(titulo)).join(";");
  const linhas = registros.map(registroParaLinhaCSV);
  const BOM = "﻿";
  return BOM + [cabecalho, ...linhas].join("\r\n");
}

function baixarCSV(conteudo, nomeArquivo) {
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
