const DESLOCAMENTO_DE_BRASILIA_EM_MS = 3 * 60 * 60 * 1000;

export function formatarDataDeBrasilia(data: Date): string {
  const horarioLocal = new Date(data.getTime() - DESLOCAMENTO_DE_BRASILIA_EM_MS);
  return `${horarioLocal.toISOString().slice(0, 19)}-03:00`;
}

const FORMATO_DA_DATA_ENVIADA = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})-03:00$/;

export function lerDataDeBrasilia(texto: string): Date | null {
  const partes = FORMATO_DA_DATA_ENVIADA.exec(texto);
  if (!partes) {
    return null;
  }
  const [ano, mes, dia, hora, minuto] = partes.slice(1).map(Number);
  const horarioLocal = new Date(Date.UTC(ano, mes - 1, dia, hora, minuto));
  const dataExiste =
    horarioLocal.getUTCFullYear() === ano &&
    horarioLocal.getUTCMonth() === mes - 1 &&
    horarioLocal.getUTCDate() === dia &&
    horarioLocal.getUTCHours() === hora &&
    horarioLocal.getUTCMinutes() === minuto;
  return dataExiste ? new Date(horarioLocal.getTime() + DESLOCAMENTO_DE_BRASILIA_EM_MS) : null;
}