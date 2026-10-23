import type { Condicao, Posicao } from './tipos-jogador';

export interface Atributos {
  velocidade: number;
  finalizacao: number;
  passe: number;
  drible: number;
  defesa: number;
  fisico: number;
}

export interface DadosValorBase {
  overall: number;
  potencial: number;
  idade: number;
}

const PESOS_POR_POSICAO: Record<Posicao, Atributos> = {
  GOL: { velocidade: 10, finalizacao: 0, passe: 20, drible: 0, defesa: 40, fisico: 30 },
  ZAG: { velocidade: 10, finalizacao: 0, passe: 15, drible: 0, defesa: 45, fisico: 30 },
  LAT: { velocidade: 25, finalizacao: 0, passe: 20, drible: 15, defesa: 25, fisico: 15 },
  MEI: { velocidade: 10, finalizacao: 15, passe: 35, drible: 25, defesa: 5, fisico: 10 },
  ATA: { velocidade: 20, finalizacao: 40, passe: 10, drible: 20, defesa: 0, fisico: 10 },
};

export const DESCONTO_POR_CONDICAO: Record<Condicao, number> = {
  APTO: 0,
  MAL_CONDICIONADO: 1500,
  DOENTE: 3000,
};

export const AGILIDADE_MINIMA_PARA_METADE_DO_DESCONTO = 80;
export const AGILIDADE_MAXIMA_PARA_DESCONTO_EXTRA = 30;
export const DESCONTO_EXTRA_AGILIDADE_BAIXA = 1000;
export const IDADE_MAXIMA_JOVEM_PROMESSA = 21;
export const IDADE_MINIMA_VETERANO = 32;
export const AJUSTE_POR_IDADE = 1000;
export const TETO_DO_DESCONTO = -4000;
export const PISO_DO_VALOR_EM_CENTAVOS = 100;

const CENTAVOS_POR_PONTO_FAIXA_1 = 50;
const CENTAVOS_POR_PONTO_FAIXA_2 = 200;
const CENTAVOS_POR_PONTO_FAIXA_3 = 600;
const OVERALL_INICIO_FAIXA_1 = 40;
const OVERALL_INICIO_FAIXA_2 = 60;
const OVERALL_INICIO_FAIXA_3 = 75;
const PONTOS_FAIXA_1 = 20;
const PONTOS_FAIXA_2 = 15;
const PONTOS_FAIXA_3 = 24;

function dividirArredondando(numerador: number, denominador: number): number {
  return Math.floor((numerador * 2 + denominador) / (denominador * 2));
}

function limitar(valor: number, minimo: number, maximo: number): number {
  return Math.min(Math.max(valor, minimo), maximo);
}

export function calcularOverall(posicao: Posicao, atributos: Atributos): number {
  const pesos = PESOS_POR_POSICAO[posicao];
  const soma =
    atributos.velocidade * pesos.velocidade +
    atributos.finalizacao * pesos.finalizacao +
    atributos.passe * pesos.passe +
    atributos.drible * pesos.drible +
    atributos.defesa * pesos.defesa +
    atributos.fisico * pesos.fisico;
  return dividirArredondando(soma, 100);
}

function calcularParteDoOverall(overall: number): number {
  const pontosFaixa1 = limitar(overall - OVERALL_INICIO_FAIXA_1, 0, PONTOS_FAIXA_1);
  const pontosFaixa2 = limitar(overall - OVERALL_INICIO_FAIXA_2, 0, PONTOS_FAIXA_2);
  const pontosFaixa3 = limitar(overall - OVERALL_INICIO_FAIXA_3, 0, PONTOS_FAIXA_3);
  return (
    pontosFaixa1 * CENTAVOS_POR_PONTO_FAIXA_1 +
    pontosFaixa2 * CENTAVOS_POR_PONTO_FAIXA_2 +
    pontosFaixa3 * CENTAVOS_POR_PONTO_FAIXA_3
  );
}

export function calcularValorBase({ overall, potencial, idade }: DadosValorBase): number {
  let valor = calcularParteDoOverall(overall);
  if (idade <= IDADE_MAXIMA_JOVEM_PROMESSA) {
    valor = dividirArredondando(valor * (100 + potencial - overall), 100);
  }
  return Math.max(valor, PISO_DO_VALOR_EM_CENTAVOS);
}

function calcularDescontoPorCondicao(condicao: Condicao, agilidade: number): number {
  const desconto = DESCONTO_POR_CONDICAO[condicao];
  if (condicao === 'APTO') {
    return 0;
  }
  if (agilidade >= AGILIDADE_MINIMA_PARA_METADE_DO_DESCONTO) {
    return desconto / 2;
  }
  if (agilidade <= AGILIDADE_MAXIMA_PARA_DESCONTO_EXTRA) {
    return desconto + DESCONTO_EXTRA_AGILIDADE_BAIXA;
  }
  return desconto;
}

function calcularAjustePorIdade(idade: number): number {
  if (idade <= IDADE_MAXIMA_JOVEM_PROMESSA) {
    return AJUSTE_POR_IDADE;
  }
  if (idade >= IDADE_MINIMA_VETERANO) {
    return -AJUSTE_POR_IDADE;
  }
  return 0;
}

export function calcularValorDeMercado(
  valorBase: number,
  condicao: Condicao,
  agilidade: number,
  idade: number,
): number {
  const percentualTotal = Math.max(
    calcularAjustePorIdade(idade) - calcularDescontoPorCondicao(condicao, agilidade),
    TETO_DO_DESCONTO,
  );
  const valor = dividirArredondando(valorBase * (10000 + percentualTotal), 10000);
  return Math.max(valor, PISO_DO_VALOR_EM_CENTAVOS);
}