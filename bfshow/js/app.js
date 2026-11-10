// Lógica principal do app: navegação, formulário, lista paginada e ajustes.
// JS puro, sem dependências, pensado para rodar bem em tablets modestos.

(function () {
  "use strict";

  const UFS = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
    "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
    "SP", "SE", "TO",
  ];

  const ROTULOS = {
    perfilEmpresa: {
      loja_propria: "Loja própria",
      franquia: "Franquia",
      ecommerce: "E-commerce",
      ecommerce_loja: "E-commerce e loja física",
      outro: "Outro",
    },
    qtdLojas: {
      ate_5: "Até 5 lojas",
      ate_10: "Até 10 lojas",
      ate_15: "Até 15 lojas",
      ate_20: "Até 20 lojas",
      "21+": "21+ lojas",
    },
    qtdFuncionarios: {
      ate_10: "Até 10",
      ate_20: "Até 20",
      ate_40: "Até 40",
      ate_60: "Até 60",
      ate_100: "Até 100",
      "100+": "100+",
    },
    gargalos: {
      jornada_escalas: "Jornada de trabalho e Escalas",
      horas_extras: "Horas extras",
      funcoes: "Funções",
      metas_comissoes: "Metas e comissões",
      doencas_atestados: "Doenças e atestados",
      sindicato: "Relação com Sindicato",
      turnover: "Turnover/Reposição de equipe",
      faltas_advertencias: "Faltas, advertências, suspensões",
    },
    temperatura: { quente: "🔥 Quente", morno: "🌤️ Morno", frio: "❄️ Frio" },
  };

  const PAGINA_TAM = 20;

  let todosRegistros = [];
  let paginaAtual = 1;
  let filtroStatus = "todos";
  let termoBusca = "";

  document.addEventListener("DOMContentLoaded", iniciar);

  function iniciar() {
    popularUF();
    registrarNavegacao();
    registrarFormulario();
    registrarLista();
    registrarAjustes();
    registrarServiceWorker();
    registrarTecladoCaneta();
    atualizarContadores();

    window.addEventListener("online", () => {
      sincronizarPendentes().then(atualizarContadores);
    });

    // Tenta sincronizar silenciosamente ao abrir, caso já esteja online.
    if (navigator.onLine) {
      sincronizarPendentes().then(atualizarContadores);
    }
  }

  function registrarTecladoCaneta() {
    // No Chrome Android, um toque com caneta/stylus foca o campo mas o
    // Chrome nem sempre solicita o teclado virtual (ele trata a caneta como
    // um ponteiro de precisão, parecido com mouse). Forçar foco + um clique
    // sintético no pointerup resolve isso. Usa um listener só no document
    // (delegação) para cobrir também os campos criados depois, como o da
    // observação no modal da Lista.
    document.addEventListener("pointerup", (ev) => {
      if (ev.pointerType !== "pen") return;
      const alvo = ev.target.closest("input, textarea, select");
      if (!alvo || alvo.disabled || alvo.readOnly) return;
      alvo.focus();
      if (alvo.tagName !== "SELECT") alvo.click();
    });
  }

  function popularUF() {
    const select = document.getElementById("f-uf");
    for (const uf of UFS) {
      const opt = document.createElement("option");
      opt.value = uf;
      opt.textContent = uf;
      select.appendChild(opt);
    }
  }

  function registrarServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch((err) => {
        console.error("Falha ao registrar service worker:", err);
      });
    }
  }

  // ---------------------------------------------------------------- NAV ----

  function registrarNavegacao() {
    const botoes = document.querySelectorAll(".topo-nav button");
    botoes.forEach((btn) => {
      btn.addEventListener("click", () => mostrarView(btn.dataset.view));
    });
  }

  function mostrarView(nome) {
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("ativa"));
    document.getElementById("view-" + nome).classList.add("ativa");
    document.querySelectorAll(".topo-nav button").forEach((b) => {
      b.classList.toggle("ativo", b.dataset.view === nome);
    });
    if (nome === "lista") {
      carregarLista();
    } else if (nome === "ajustes") {
      atualizarAjustes();
    }
  }

  // ------------------------------------------------------------- CHIPS ----

  function wireChipsGrupo(container) {
    const tipo = container.dataset.tipo;
    container.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", (ev) => {
        if (tipo === "unico") {
          const jaSelecionado = chip.classList.contains("selecionado");
          container.querySelectorAll(".chip").forEach((c) => c.classList.remove("selecionado"));
          if (!jaSelecionado) chip.classList.add("selecionado");
        } else if (tipo === "multiplo") {
          chip.querySelector(".marcador")?.classList.toggle("marcada");
        }
        if (container.dataset.grupo === "perfilEmpresa") {
          const outroSelecionado = container.querySelector('.chip[data-valor="outro"]')?.classList.contains("selecionado");
          document.getElementById("campo-perfil-outro").classList.toggle("oculto", !outroSelecionado);
        }
      });
    });
  }

  function valorGrupoUnico(nomeGrupo) {
    const container = document.querySelector(`.chips[data-grupo="${nomeGrupo}"]`);
    const sel = container.querySelector(".chip.selecionado");
    return sel ? sel.dataset.valor : null;
  }

  function valoresGargalos() {
    const container = document.querySelector('.chips[data-grupo="gargalos"]');
    return [...container.querySelectorAll(".chip")]
      .filter((c) => c.querySelector(".marcador")?.classList.contains("marcada"))
      .map((c) => c.dataset.valor);
  }

  function limparChipsGrupo(nomeGrupo) {
    document.querySelectorAll(`.chips[data-grupo="${nomeGrupo}"] .chip`).forEach((c) => {
      c.classList.remove("selecionado");
      c.querySelector(".marcador")?.classList.remove("marcada");
    });
  }

  // --------------------------------------------------------- FORMULÁRIO ----

  function registrarFormulario() {
    document.querySelectorAll(".chips").forEach(wireChipsGrupo);

    document.getElementById("form-entrevista").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      await salvarEntrevista();
    });

    document.getElementById("btn-limpar").addEventListener("click", () => {
      if (confirm("Limpar todos os campos preenchidos?")) resetarFormulario();
    });
  }

  async function salvarEntrevista() {
    const botaoSalvar = document.getElementById("btn-salvar");
    botaoSalvar.disabled = true;

    const registro = criarRegistroVazio();
    registro.nome = valorInput("f-nome");
    registro.cargo = valorInput("f-cargo");
    registro.empresa = valorInput("f-empresa");
    registro.cidade = valorInput("f-cidade");
    registro.uf = valorInput("f-uf");
    registro.perfilEmpresa = valorGrupoUnico("perfilEmpresa");
    registro.qtdLojas = valorGrupoUnico("qtdLojas");
    registro.qtdFuncionarios = valorGrupoUnico("qtdFuncionarios");

    registro.perfilEmpresaOutroTexto = valorInput("f-perfil-outro");
    registro.gargalos = valoresGargalos();

    registro.consentimento = document.getElementById("f-consentimento").checked;
    registro.contato = valorInput("f-contato");
    registro.temperatura = valorGrupoUnico("temperatura");
    registro.observacao = valorInput("f-observacao");

    try {
      await dbSalvarEntrevista(registro);
      resetarFormulario();
      mostrarToast("Entrevista salva! ✓");
      atualizarContadores();
      if (navigator.onLine) {
        sincronizarPendentes().then(atualizarContadores);
      }
    } catch (err) {
      console.error(err);
      alert("Não foi possível salvar. Tente novamente.");
    } finally {
      botaoSalvar.disabled = false;
    }
  }

  function valorInput(id) {
    return document.getElementById(id).value.trim();
  }

  function resetarFormulario() {
    document.getElementById("form-entrevista").reset();
    ["perfilEmpresa", "qtdLojas", "qtdFuncionarios", "gargalos", "temperatura"].forEach(limparChipsGrupo);
    document.getElementById("campo-perfil-outro").classList.add("oculto");
    document.getElementById("secao-uso-interno").removeAttribute("open");
    document.getElementById("f-nome").focus();
  }

  function mostrarToast(texto) {
    const toast = document.getElementById("toast");
    toast.textContent = texto;
    toast.classList.add("visivel");
    clearTimeout(mostrarToast._t);
    mostrarToast._t = setTimeout(() => toast.classList.remove("visivel"), 1800);
  }

  // --------------------------------------------------------------- LISTA ----

  function registrarLista() {
    document.getElementById("busca-lista").addEventListener("input", (ev) => {
      termoBusca = ev.target.value.toLowerCase();
      paginaAtual = 1;
      renderizarLista();
    });

    document.querySelectorAll(".filtro-status button").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".filtro-status button").forEach((b) => b.classList.remove("ativo"));
        btn.classList.add("ativo");
        filtroStatus = btn.dataset.status;
        paginaAtual = 1;
        renderizarLista();
      });
    });

    document.getElementById("btn-pag-anterior").addEventListener("click", () => {
      if (paginaAtual > 1) {
        paginaAtual--;
        renderizarLista();
      }
    });
    document.getElementById("btn-pag-proxima").addEventListener("click", () => {
      paginaAtual++;
      renderizarLista();
    });
  }

  async function carregarLista() {
    todosRegistros = await dbListarTodas();
    todosRegistros.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    renderizarLista();
  }

  function registrosFiltrados() {
    return todosRegistros.filter((r) => {
      if (filtroStatus !== "todos" && r.syncStatus !== filtroStatus) return false;
      if (!termoBusca) return true;
      const alvo = `${r.nome} ${r.empresa} ${r.cidade}`.toLowerCase();
      return alvo.includes(termoBusca);
    });
  }

  function renderizarLista() {
    const filtrados = registrosFiltrados();
    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGINA_TAM));
    if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;

    const inicio = (paginaAtual - 1) * PAGINA_TAM;
    const pagina = filtrados.slice(inicio, inicio + PAGINA_TAM);

    const corpo = document.getElementById("corpo-lista");
    corpo.textContent = "";

    document.getElementById("lista-vazia").classList.toggle("oculto", filtrados.length > 0);

    const frag = document.createDocumentFragment();
    for (const r of pagina) {
      frag.appendChild(criarLinhaRegistro(r));
    }
    corpo.appendChild(frag);

    document.getElementById("pag-info").textContent = `Página ${paginaAtual} de ${totalPaginas}`;
    document.getElementById("btn-pag-anterior").disabled = paginaAtual <= 1;
    document.getElementById("btn-pag-proxima").disabled = paginaAtual >= totalPaginas;
  }

  function criarLinhaRegistro(r) {
    const linha = document.createElement("div");
    linha.className = "linha-registro";

    const col1 = document.createElement("div");
    const nomeEl = document.createElement("div");
    nomeEl.className = "nome-principal";
    nomeEl.textContent = r.nome || "(sem nome)";
    const empresaEl = document.createElement("div");
    empresaEl.className = "sub-info";
    empresaEl.textContent = r.empresa || "—";
    col1.append(nomeEl, empresaEl);

    const col2 = document.createElement("div");
    col2.textContent = [r.cidade, r.uf].filter(Boolean).join(" / ") || "—";

    const col3 = document.createElement("div");
    col3.textContent = ROTULOS.perfilEmpresa[r.perfilEmpresa] || "—";

    const col4 = document.createElement("div");
    const badge = document.createElement("span");
    badge.className = "badge " + (r.syncStatus === "sent" ? "badge-enviado" : "badge-pendente");
    badge.textContent = r.syncStatus === "sent" ? "Enviado" : "Pendente";
    col4.appendChild(badge);

    const col5 = document.createElement("div");
    const ponto = document.createElement("span");
    ponto.className = "ponto-temp ponto-" + (r.temperatura || "nenhum");
    col5.append(ponto, document.createTextNode(ROTULOS.temperatura[r.temperatura] || "Não avaliado"));

    linha.append(col1, col2, col3, col4, col5);
    linha.addEventListener("click", () => abrirModalRegistro(r.id));
    return linha;
  }

  // --------------------------------------------------------------- MODAL ----

  function abrirModalRegistro(id) {
    const r = todosRegistros.find((x) => x.id === id);
    if (!r) return;

    const fundo = document.createElement("div");
    fundo.className = "modal-fundo";

    const gargalosTexto = (r.gargalos || []).map((g) => ROTULOS.gargalos[g] || g).join(", ") || "—";

    fundo.innerHTML = `
      <div class="modal">
        <h3>${escaparHTML(r.nome || "(sem nome)")}</h3>
        <div class="sub-info">${escaparHTML(r.cargo || "")} ${r.cargo && r.empresa ? "·" : ""} ${escaparHTML(r.empresa || "")}</div>

        <div class="ficha-leitura">
          <div><b>Cidade/UF:</b> ${escaparHTML([r.cidade, r.uf].filter(Boolean).join(" / ") || "—")}</div>
          <div><b>Perfil:</b> ${escaparHTML(ROTULOS.perfilEmpresa[r.perfilEmpresa] || "—")}</div>
          ${r.perfilEmpresaOutroTexto ? `<div><b>Outro perfil:</b> ${escaparHTML(r.perfilEmpresaOutroTexto)}</div>` : ""}
          <div><b>Lojas:</b> ${escaparHTML(ROTULOS.qtdLojas[r.qtdLojas] || "—")} &nbsp; <b>Funcionários:</b> ${escaparHTML(ROTULOS.qtdFuncionarios[r.qtdFuncionarios] || "—")}</div>
          <div><b>Problemas:</b> ${escaparHTML(gargalosTexto)}</div>
          <div><b>Contato:</b> ${escaparHTML(r.contato || "—")} &nbsp; <b>Aceitou material:</b> ${r.consentimento ? "Sim" : "Não"}</div>
          <div><b>Registrado em:</b> ${escaparHTML(isoParaDataHoraBR(r.createdAt))}</div>
        </div>

        <div class="secao interno" style="margin:0 0 14px">
          <h2>Uso interno</h2>
          <div class="grupo-chips">
            <label>Temperatura do lead</label>
            <div class="chips" data-grupo="temperatura-modal" data-tipo="unico">
              <button type="button" class="chip" data-valor="quente">🔥 Quente</button>
              <button type="button" class="chip" data-valor="morno">🌤️ Morno</button>
              <button type="button" class="chip" data-valor="frio">❄️ Frio</button>
            </div>
          </div>
          <div class="campo">
            <label for="modal-observacao">Observação livre</label>
            <textarea id="modal-observacao">${escaparHTML(r.observacao || "")}</textarea>
          </div>
        </div>

        <div class="modal-rodape">
          <button type="button" class="botao botao-perigo" id="modal-excluir">Excluir</button>
          <div style="display:flex;gap:10px">
            <button type="button" class="botao botao-secundario" id="modal-fechar">Fechar</button>
            <button type="button" class="botao botao-primario" id="modal-salvar">Salvar</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(fundo);

    const grupoTemp = fundo.querySelector('.chips[data-grupo="temperatura-modal"]');
    if (r.temperatura) {
      grupoTemp.querySelector(`.chip[data-valor="${r.temperatura}"]`)?.classList.add("selecionado");
    }
    wireChipsGrupo(grupoTemp);

    fundo.querySelector("#modal-fechar").addEventListener("click", () => fundo.remove());
    fundo.addEventListener("click", (ev) => {
      if (ev.target === fundo) fundo.remove();
    });

    fundo.querySelector("#modal-excluir").addEventListener("click", async () => {
      if (!confirm("Excluir esta entrevista definitivamente?")) return;
      await dbExcluir(r.id);
      fundo.remove();
      await carregarLista();
      atualizarContadores();
      mostrarToast("Entrevista excluída.");
    });

    fundo.querySelector("#modal-salvar").addEventListener("click", async () => {
      const temperaturaSel = grupoTemp.querySelector(".chip.selecionado");
      r.temperatura = temperaturaSel ? temperaturaSel.dataset.valor : null;
      r.observacao = fundo.querySelector("#modal-observacao").value.trim();
      r.updatedAt = agoraBrasiliaISO();
      await dbSalvarEntrevista(r);
      fundo.remove();
      await carregarLista();
      mostrarToast("Alterações salvas.");
    });
  }

  function escaparHTML(texto) {
    const div = document.createElement("div");
    div.textContent = String(texto ?? "");
    return div.innerHTML;
  }

  // ------------------------------------------------------------- AJUSTES ----

  function registrarAjustes() {
    document.getElementById("f-webhook-url").value = obterWebhookUrl();

    document.getElementById("btn-salvar-url").addEventListener("click", () => {
      const url = document.getElementById("f-webhook-url").value.trim();
      salvarWebhookUrl(url);
      mostrarToast("URL salva.");
      atualizarAjustes();
    });

    document.getElementById("btn-sincronizar").addEventListener("click", async () => {
      const botao = document.getElementById("btn-sincronizar");
      const statusEl = document.getElementById("status-sync");
      botao.disabled = true;
      statusEl.textContent = "Sincronizando...";
      const resultado = await sincronizarPendentes((p) => {
        statusEl.textContent = `Enviando ${p.enviados + p.falhas} de ${p.total}...`;
      });
      botao.disabled = false;
      await atualizarContadores();
      await atualizarAjustes();
      if (resultado.erro === "sem-url") {
        statusEl.textContent = "Configure a URL do Apps Script antes de sincronizar.";
      } else if (resultado.erro === "offline") {
        statusEl.textContent = "Sem conexão com a internet agora.";
      } else {
        statusEl.textContent = `Concluído: ${resultado.enviados} enviado(s), ${resultado.falhas} falha(s).`;
      }
    });

    document.getElementById("btn-exportar-csv").addEventListener("click", async () => {
      const registros = await dbListarTodas();
      registros.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      const csv = gerarCSV(registros);
      const dataArquivo = agoraBrasiliaISO().slice(0, 10);
      baixarCSV(csv, `bfshow-pesquisa-backup-${dataArquivo}.csv`);
    });
  }

  async function atualizarAjustes() {
    const registros = await dbListarTodas();
    const pendentes = registros.filter((r) => r.syncStatus !== "sent").length;
    const enviados = registros.length - pendentes;
    document.getElementById("resumo-total").textContent = registros.length;
    document.getElementById("resumo-pendentes").textContent = pendentes;
    document.getElementById("resumo-enviados").textContent = enviados;

    const ultimo = obterUltimoSync();
    const statusEl = document.getElementById("status-sync");
    if (!statusEl.textContent.startsWith("Sincronizando") && !statusEl.textContent.startsWith("Enviando")) {
      statusEl.textContent = ultimo ? `Última sincronização: ${isoParaDataHoraBR(ultimo)}` : "Nunca sincronizado.";
    }
  }

  // ------------------------------------------------------------ CONTADORES ----

  async function atualizarContadores() {
    const registros = await dbListarTodas();
    const inicioHoje = inicioDoDiaBrasiliaISO();
    const hoje = registros.filter((r) => r.createdAt >= inicioHoje).length;
    const pendentes = registros.filter((r) => r.syncStatus !== "sent").length;

    document.getElementById("contador-dia").textContent = `${hoje} hoje`;

    const badge = document.getElementById("badge-pendentes");
    if (pendentes > 0) {
      badge.textContent = `${pendentes} pendente${pendentes > 1 ? "s" : ""}`;
      badge.classList.add("visivel");
    } else {
      badge.classList.remove("visivel");
    }
  }
})();
