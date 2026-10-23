import { dividirArredondando } from '../comum/arredondamento';

const TAXA_DE_COMPRA_EM_PERCENTUAL = 5;
const VALOR_A_PARTIR_DO_QUAL_HA_TAXA = 3000;
const MULTA_MAXIMA = 1000;
const FAIXA_DA_COMISSAO_MENOR = 1000;
const COMISSAO_ATE_A_FAIXA_EM_PERCENTUAL = 10;
const COMISSAO_ACIMA_DA_FAIXA_EM_PERCENTUAL = 20;

// Todos os valores em centavos.
export function calcularTaxaDeCompra(valorDeMercado: number): number {
  return valorDeMercado > VALOR_A_PARTIR_DO_QUAL_HA_TAXA
    ? dividirArredondando(valorDeMercado * TAXA_DE_COMPRA_EM_PERCENTUAL, 100)
    : 0;
}

export function custoCabeNoCaixa(custoTotal: number, caixa: number): boolean {
  return custoTotal * 2 <= caixa;
}

export function calcularMulta(valorDeMercado: number, percentualDaMulta: number): number {
  return Math.min(dividirArredondando(valorDeMercado * percentualDaMulta, 100), MULTA_MAXIMA);
}

export function calcularComissao(lucro: number): number {
  if (lucro <= 0) {
    return 0;
  }
  const ateAFaixa = Math.min(lucro, FAIXA_DA_COMISSAO_MENOR);
  const acimaDaFaixa = lucro - ateAFaixa;
  return dividirArredondando(
    ateAFaixa * COMISSAO_ATE_A_FAIXA_EM_PERCENTUAL + acimaDaFaixa * COMISSAO_ACIMA_DA_FAIXA_EM_PERCENTUAL,
    100,
  );
}