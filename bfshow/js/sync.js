// Sincronização dos registros pendentes com um Google Apps Script (Web App),
// que grava cada entrevista como uma linha numa planilha do Google.

const CHAVE_WEBHOOK = "bfshow-pesquisa:webhookUrl";
const CHAVE_ULTIMO_SYNC = "bfshow-pesquisa:ultimoSync";

function obterWebhookUrl() {
  try {
    return localStorage.getItem(CHAVE_WEBHOOK) || "";
  } catch {
    return "";
  }
}

function salvarWebhookUrl(url) {
  try {
    localStorage.setItem(CHAVE_WEBHOOK, url.trim());
  } catch {
    // Armazenamento indisponível; a sincronização ficará desativada nesta sessão.
  }
}

function obterUltimoSync() {
  try {
    return localStorage.getItem(CHAVE_ULTIMO_SYNC) || "";
  } catch {
    return "";
  }
}

function registrarUltimoSync(iso) {
  try {
    localStorage.setItem(CHAVE_ULTIMO_SYNC, iso);
  } catch {
    // ignora
  }
}

function registroParaPayload(r) {
  return {
    id: r.id,
    createdAt: r.createdAt,
    nome: r.nome,
    cargo: r.cargo,
    empresa: r.empresa,
    cidade: r.cidade,
    uf: r.uf,
    perfilEmpresa: r.perfilEmpresa,
    perfilEmpresaOutroTexto: r.perfilEmpresaOutroTexto,
    qtdLojas: r.qtdLojas,
    qtdFuncionarios: r.qtdFuncionarios,
    gargalos: (r.gargalos || []).join(" | "),
    consentimento: r.consentimento ? "Sim" : "Não",
    contato: r.contato,
    temperatura: r.temperatura,
    observacao: r.observacao,
  };
}

async function enviarRegistro(url, registro) {
  // Content-Type "text/plain" evita o preflight CORS (OPTIONS), que o
  // Apps Script não responde de forma confiável em Web Apps públicos.
  const resposta = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(registroParaPayload(registro)),
  });
  if (!resposta.ok) {
    throw new Error("HTTP " + resposta.status);
  }
  const dados = await resposta.json().catch(() => ({ ok: true }));
  if (dados && dados.ok === false) {
    throw new Error(dados.erro || "Falha reportada pelo Apps Script");
  }
  return dados;
}

/**
 * Envia todos os registros pendentes. Retorna { enviados, falhas }.
 * Cada registro enviado com sucesso é marcado como "sent" no IndexedDB.
 */
async function sincronizarPendentes(onProgresso) {
  const url = obterWebhookUrl();
  if (!url) {
    return { enviados: 0, falhas: 0, erro: "sem-url" };
  }
  if (!navigator.onLine) {
    return { enviados: 0, falhas: 0, erro: "offline" };
  }

  const todos = await dbListarTodas();
  const pendentes = todos.filter((r) => r.syncStatus !== "sent");

  let enviados = 0;
  let falhas = 0;

  for (const registro of pendentes) {
    try {
      await enviarRegistro(url, registro);
      registro.syncStatus = "sent";
      registro.syncedAt = agoraBrasiliaISO();
      await dbSalvarEntrevista(registro);
      enviados++;
    } catch (err) {
      falhas++;
      console.error("Falha ao sincronizar registro", registro.id, err);
    }
    if (onProgresso) onProgresso({ enviados, falhas, total: pendentes.length });
  }

  if (enviados > 0) {
    registrarUltimoSync(agoraBrasiliaISO());
  }

  return { enviados, falhas };
}
