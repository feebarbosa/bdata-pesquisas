// Camada de acesso ao IndexedDB. Sem dependências externas.

const DB_NOME = "bfshow-pesquisa-db";
const DB_VERSAO = 1;
const LOJA_ENTREVISTAS = "entrevistas";

let dbPromise = null;

function abrirDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NOME, DB_VERSAO);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(LOJA_ENTREVISTAS)) {
        const loja = db.createObjectStore(LOJA_ENTREVISTAS, { keyPath: "id" });
        loja.createIndex("createdAt", "createdAt");
        loja.createIndex("syncStatus", "syncStatus");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function dbSalvarEntrevista(registro) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LOJA_ENTREVISTAS, "readwrite");
    tx.objectStore(LOJA_ENTREVISTAS).put(registro);
    tx.oncomplete = () => resolve(registro);
    tx.onerror = () => reject(tx.error);
  });
}

async function dbListarTodas() {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LOJA_ENTREVISTAS, "readonly");
    const req = tx.objectStore(LOJA_ENTREVISTAS).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function dbBuscarPorId(id) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LOJA_ENTREVISTAS, "readonly");
    const req = tx.objectStore(LOJA_ENTREVISTAS).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function dbExcluir(id) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LOJA_ENTREVISTAS, "readwrite");
    tx.objectStore(LOJA_ENTREVISTAS).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function criarRegistroVazio() {
  return {
    id: (crypto.randomUUID ? crypto.randomUUID() : "id-" + Date.now() + "-" + Math.random().toString(16).slice(2)),
    createdAt: agoraBrasiliaISO(),
    updatedAt: agoraBrasiliaISO(),
    nome: "",
    cargo: "",
    empresa: "",
    cidade: "",
    uf: "",
    perfilEmpresa: null,
    perfilEmpresaOutroTexto: "",
    qtdLojas: null,
    qtdFuncionarios: null,
    gargalos: [],
    consentimento: false,
    contato: "",
    temperatura: null,
    observacao: "",
    syncStatus: "pending",
    syncedAt: null,
  };
}
