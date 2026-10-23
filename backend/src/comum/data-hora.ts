const DESLOCAMENTO_DE_BRASILIA_EM_MS = 3 * 60 * 60 * 1000;

export function formatarDataDeBrasilia(data: Date): string {
  const horarioLocal = new Date(data.getTime() - DESLOCAMENTO_DE_BRASILIA_EM_MS);
  return `${horarioLocal.toISOString().slice(0, 19)}-03:00`;
}