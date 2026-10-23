const MILISSEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

const FAIXAS_DA_MULTA = [
  { ateDias: 0, percentual: 0 },
  { ateDias: 30, percentual: 5 },
  { ateDias: 180, percentual: 10 },
];
const PERCENTUAL_MAXIMO_DA_MULTA = 20;

export function calcularDiasRestantes(fimDaFidelidade: Date, momento: Date): number {
  const diferenca = fimDaFidelidade.getTime() - momento.getTime();
  return diferenca <= 0 ? 0 : Math.ceil(diferenca / MILISSEGUNDOS_POR_DIA);
}

export function calcularPercentualDaMulta(diasRestantes: number): number {
  const faixa = FAIXAS_DA_MULTA.find((candidata) => diasRestantes <= candidata.ateDias);
  return faixa ? faixa.percentual : PERCENTUAL_MAXIMO_DA_MULTA;
}