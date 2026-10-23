import { Injectable, NotFoundException } from '@nestjs/common';
import type { Transacao } from '@prisma/client';
import { centavosParaMoeda, decimalParaCentavos } from '../comum/moeda';
import { PrismaService } from '../prisma/prisma.service';
import { HistoricoQueryDto, TIPOS_DE_TRANSACAO, lerTipos } from './dto/historico-query.dto';
import { montarCsv } from './historico-csv';
import { TransacaoResposta, montarTransacaoResposta } from './transacao-resposta';

export interface ResumoDoHistorico {
  total_spent: number;
  total_received: number;
  total_fees: number;
  total_penalties: number;
  total_profit: number;
}

export interface HistoricoResposta {
  data: TransacaoResposta[];
  summary: ResumoDoHistorico;
}

function somar(transacoes: Transacao[], campo: (transacao: Transacao) => number): number {
  return transacoes.reduce((soma, transacao) => soma + campo(transacao), 0);
}

function montarResumo(transacoes: Transacao[]): ResumoDoHistorico {
  const compras = transacoes.filter((transacao) => transacao.tipo === 'COMPRA');
  const vendas = transacoes.filter((transacao) => transacao.tipo === 'VENDA');
  const centavos = (valor: Transacao['valor']) => decimalParaCentavos(valor);

  return {
    total_spent: centavosParaMoeda(somar(compras, (t) => centavos(t.valor) + centavos(t.taxa))),
    total_received: centavosParaMoeda(somar(vendas, (t) => centavos(t.variacaoCaixa))),
    total_fees: centavosParaMoeda(somar(transacoes, (t) => centavos(t.taxa))),
    total_penalties: centavosParaMoeda(somar(vendas, (t) => centavos(t.multa))),
    total_profit: centavosParaMoeda(somar(vendas, (t) => (t.lucro === null ? 0 : centavos(t.lucro)))),
  };
}

@Injectable()
export class HistoricoService {
  constructor(private readonly prisma: PrismaService) {}

  async consultar(clubeId: number, consulta: HistoricoQueryDto): Promise<HistoricoResposta> {
    const transacoes = await this.buscarTransacoes(clubeId, consulta);
    return { data: transacoes.map(montarTransacaoResposta), summary: montarResumo(transacoes) };
  }

  async exportar(clubeId: number, consulta: HistoricoQueryDto): Promise<string> {
    return montarCsv(await this.buscarTransacoes(clubeId, consulta));
  }

  private async buscarTransacoes(clubeId: number, consulta: HistoricoQueryDto): Promise<Transacao[]> {
    const clube = await this.prisma.clube.findUnique({ where: { id: clubeId }, select: { id: true } });
    if (!clube) {
      throw new NotFoundException('Clube não encontrado.');
    }

    const jogadorId = consulta.player_id === undefined ? undefined : Number(consulta.player_id);
    if (jogadorId !== undefined) {
      const jogador = await this.prisma.jogador.findFirst({
        where: { id: jogadorId, excluidoEm: null },
        select: { id: true },
      });
      if (!jogador) {
        throw new NotFoundException('Jogador não encontrado.');
      }
    }

    const tipos = consulta.type === undefined ? [...TIPOS_DE_TRANSACAO] : (lerTipos(consulta.type) ?? [...TIPOS_DE_TRANSACAO]);
    return this.prisma.transacao.findMany({
      where: { clubeId, tipo: { in: tipos }, ...(jogadorId === undefined ? {} : { jogadorId }) },
      orderBy: [{ criadoEm: 'desc' }, { id: 'desc' }],
    });
  }
}