import type { Transacao } from '@prisma/client';
import { formatarDataDeBrasilia } from '../comum/data-hora';
import { decimalParaCentavos } from '../comum/moeda';

const CABECALHO = 'data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa';

function formatarValor(valor: Transacao['valor']): string {
  const centavos = decimalParaCentavos(valor);
  const sinal = centavos < 0 ? '-' : '';
  const absoluto = Math.abs(centavos);
  const reais = Math.trunc(absoluto / 100);
  const resto = String(absoluto % 100).padStart(2, '0');
  return `${sinal}${reais},${resto}`;
}

function protegerTexto(texto: string): string {
  return /[;"\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

export function montarCsv(transacoes: Transacao[]): string {
  const linhas = transacoes.map((transacao) =>
    [
      formatarDataDeBrasilia(transacao.criadoEm),
      transacao.tipo,
      protegerTexto(transacao.nomeJogador),
      formatarValor(transacao.valor),
      formatarValor(transacao.taxa),
      formatarValor(transacao.multa),
      transacao.lucro === null ? '' : formatarValor(transacao.lucro),
      formatarValor(transacao.variacaoCaixa),
    ].join(';'),
  );
  return [CABECALHO, ...linhas].map((linha) => `${linha}\n`).join('');
}