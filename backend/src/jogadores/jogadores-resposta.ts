import type { Jogador } from '@prisma/client';
import { centavosParaMoeda, decimalParaCentavos } from '../comum/moeda';
import { calcularOverall, calcularValorDeMercado } from './calculo-jogador';
import type { Condicao, Posicao } from './tipos-jogador';

export interface JogadorResposta {
  id: number;
  name: string;
  position: Posicao;
  agility: number;
  age: number;
  condition: Condicao;
  base_value: number;
  market_value: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  potential: number;
  overall: number;
  club_id: number | null;
}

export function montarJogadorResposta(jogador: Jogador): JogadorResposta {
  const posicao = jogador.posicao as Posicao;
  const condicao = jogador.condicao as Condicao;
  const overall = calcularOverall(posicao, {
    velocidade: jogador.velocidade,
    finalizacao: jogador.finalizacao,
    passe: jogador.passe,
    drible: jogador.drible,
    defesa: jogador.defesa,
    fisico: jogador.fisico,
  });
  const valorBase = decimalParaCentavos(jogador.valorBase);
  const valorDeMercado = calcularValorDeMercado(valorBase, condicao, jogador.agilidade, jogador.idade);

  return {
    id: jogador.id,
    name: jogador.nome,
    position: posicao,
    agility: jogador.agilidade,
    age: jogador.idade,
    condition: condicao,
    base_value: centavosParaMoeda(valorBase),
    market_value: centavosParaMoeda(valorDeMercado),
    pace: jogador.velocidade,
    shooting: jogador.finalizacao,
    passing: jogador.passe,
    dribbling: jogador.drible,
    defending: jogador.defesa,
    physical: jogador.fisico,
    potential: jogador.potencial,
    overall,
    club_id: jogador.clubeId,
  };
}