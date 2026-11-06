// Utilidades de data/hora fixadas no fuso de Brasília (UTC-3, sem horário de
// verão desde 2019), independente do fuso configurado no aparelho.

function agoraBrasiliaISO() {
  return dataParaBrasiliaISO(new Date());
}

function dataParaBrasiliaISO(data) {
  const utcMs = data.getTime() + data.getTimezoneOffset() * 60000;
  const brasilia = new Date(utcMs - 3 * 3600000);
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${brasilia.getFullYear()}-${pad(brasilia.getMonth() + 1)}-${pad(brasilia.getDate())}` +
    `T${pad(brasilia.getHours())}:${pad(brasilia.getMinutes())}:${pad(brasilia.getSeconds())}-03:00`
  );
}

function isoParaDataHoraBR(iso) {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return iso;
  const [, ano, mes, dia, hora, min] = m;
  return `${dia}/${mes}/${ano} ${hora}:${min}`;
}

function inicioDoDiaBrasiliaISO() {
  const iso = agoraBrasiliaISO();
  return iso.slice(0, 10) + "T00:00:00-03:00";
}
