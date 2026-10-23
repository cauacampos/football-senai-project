import type { Contrato, Transacao } from '@prisma/client';
import { formatarDataDeBrasilia } from '../comum/data-hora';
import { centavosParaMoeda, decimalParaCentavos } from '../comum/moeda';

export interface TransacaoResposta {
  id: number;
  club_id: number;
  player_id: number;
  player_name: string;
  type: string;
  value: number;
  fee: number;
  penalty: number;
  profit: number | null;
  cash_change: number;
  created_at: string;
}

export interface CompraResposta extends TransacaoResposta {
  contract: { purchase_value: number; loyalty_until: string; status: string };
  club_cash: number;
}

export interface VendaResposta extends TransacaoResposta {
  purchase_value: number;
  remaining_days: number;
  penalty_rate: number;
  contract_status: string;
  club_cash: number;
}

export function emReais(valor: Transacao['valor']): number {
  return centavosParaMoeda(decimalParaCentavos(valor));
}

export function montarTransacaoResposta(transacao: Transacao): TransacaoResposta {
  return {
    id: transacao.id,
    club_id: transacao.clubeId,
    player_id: transacao.jogadorId,
    player_name: transacao.nomeJogador,
    type: transacao.tipo,
    value: emReais(transacao.valor),
    fee: emReais(transacao.taxa),
    penalty: emReais(transacao.multa),
    profit: transacao.lucro === null ? null : emReais(transacao.lucro),
    cash_change: emReais(transacao.variacaoCaixa),
    created_at: formatarDataDeBrasilia(transacao.criadoEm),
  };
}

export function montarContratoDaCompra(contrato: Contrato): CompraResposta['contract'] {
  return {
    purchase_value: emReais(contrato.valorCompra),
    loyalty_until: formatarDataDeBrasilia(contrato.fidelidadeAte),
    status: contrato.situacao,
  };
}