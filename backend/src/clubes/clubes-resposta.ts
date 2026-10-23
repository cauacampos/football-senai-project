import type { Clube } from '@prisma/client';
import { centavosParaMoeda, decimalParaCentavos } from '../comum/moeda';
import type { JogadorResposta } from '../jogadores/jogadores-resposta';

export interface ClubeResposta {
  id: number;
  name: string;
  acronym: string;
  cash: number;
  squad_value: number;
  net_worth: number;
}

export interface ContratoResposta {
  purchase_value: number;
  loyalty_until: string;
  remaining_days: number;
  penalty_rate: number;
}

export interface JogadorDoElencoResposta extends JogadorResposta {
  contract: ContratoResposta | null;
}

export interface ClubeDetalhadoResposta extends ClubeResposta {
  players: JogadorDoElencoResposta[];
}

export function montarClubeResposta(clube: Clube, valorDoElencoEmCentavos: number): ClubeResposta {
  const caixaEmCentavos = decimalParaCentavos(clube.caixa);
  return {
    id: clube.id,
    name: clube.nome,
    acronym: clube.sigla,
    cash: centavosParaMoeda(caixaEmCentavos),
    squad_value: centavosParaMoeda(valorDoElencoEmCentavos),
    net_worth: centavosParaMoeda(caixaEmCentavos + valorDoElencoEmCentavos),
  };
}