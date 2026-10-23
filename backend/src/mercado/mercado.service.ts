import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Clube, Jogador } from '@prisma/client';
import { lerDataDeBrasilia } from '../comum/data-hora';
import { centavosParaMoeda, centavosParaTexto, decimalParaCentavos } from '../comum/moeda';
import { LIMITE_DO_ELENCO } from '../clubes/limites-clube';
import { calcularDiasRestantes, calcularPercentualDaMulta } from '../contratos/calculo-contrato';
import { calcularValorDeMercado } from '../jogadores/calculo-jogador';
import type { Condicao } from '../comum/tipos-jogador';
import { PrismaService } from '../prisma/prisma.service';
import { calcularComissao, calcularMulta, calcularTaxaDeCompra, custoCabeNoCaixa } from './calculo-mercado';
import { ComprarJogadorDto } from './dto/comprar-jogador.dto';
import {
  CompraResposta,
  VendaResposta,
  montarContratoDaCompra,
  montarTransacaoResposta,
} from './transacao-resposta';

const MILISSEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;
const PRAZO_MAXIMO_DA_FIDELIDADE_EM_DIAS = 1095;

function valorDeMercadoEmCentavos(jogador: Jogador): number {
  return calcularValorDeMercado(
    decimalParaCentavos(jogador.valorBase),
    jogador.condicao as Condicao,
    jogador.agilidade,
    jogador.idade,
  );
}

function formatarMoeda(centavos: number): string {
  return centavosParaTexto(centavos).replace('.', ',');
}

@Injectable()
export class MercadoService {
  constructor(private readonly prisma: PrismaService) {}

  async comprar(jogadorId: number, dto: ComprarJogadorDto): Promise<CompraResposta> {
    const agora = new Date();
    const fimDaFidelidade = this.validarFimDaFidelidade(dto.loyalty_until, agora);

    return this.prisma.$transaction(async (transacao) => {
      await this.travarJogador(transacao, jogadorId);
      const jogador = await this.buscarJogadorAtivo(transacao, jogadorId);
      if (jogador.clubeId !== null) {
        throw new ConflictException('O jogador não está livre.');
      }

      await this.travarClube(transacao, dto.club_id);
      const clube = await this.buscarClube(transacao, dto.club_id);

      const jaFoiVendidoPeloClube = await transacao.transacao.count({
        where: { clubeId: clube.id, jogadorId, tipo: 'VENDA' },
      });
      if (jaFoiVendidoPeloClube > 0) {
        throw new ConflictException('O clube não pode recomprar um jogador que ele mesmo vendeu.');
      }
      if ((await transacao.jogador.count({ where: { clubeId: clube.id } })) >= LIMITE_DO_ELENCO) {
        throw new ConflictException(`O elenco já tem ${LIMITE_DO_ELENCO} jogadores.`);
      }

      const valorDeMercado = valorDeMercadoEmCentavos(jogador);
      const taxa = calcularTaxaDeCompra(valorDeMercado);
      const custoTotal = valorDeMercado + taxa;
      const caixaAntes = decimalParaCentavos(clube.caixa);
      if (!custoCabeNoCaixa(custoTotal, caixaAntes)) {
        throw new ConflictException(
          `O custo da compra (${formatarMoeda(custoTotal)}) passa do limite de 50% do caixa (${formatarMoeda(caixaAntes / 2)}).`,
        );
      }

      const contrato = await transacao.contrato.create({
        data: {
          jogadorId,
          clubeId: clube.id,
          valorCompra: centavosParaTexto(valorDeMercado),
          fidelidadeAte: fimDaFidelidade,
          situacao: 'ATIVO',
          iniciadoEm: agora,
        },
      });
      await transacao.jogador.update({ where: { id: jogadorId }, data: { clubeId: clube.id } });
      const caixaDepois = caixaAntes - custoTotal;
      await transacao.clube.update({ where: { id: clube.id }, data: { caixa: centavosParaTexto(caixaDepois) } });
      const registro = await transacao.transacao.create({
        data: {
          clubeId: clube.id,
          jogadorId,
          nomeJogador: jogador.nome,
          tipo: 'COMPRA',
          valor: centavosParaTexto(valorDeMercado),
          taxa: centavosParaTexto(taxa),
          multa: centavosParaTexto(0),
          lucro: null,
          variacaoCaixa: centavosParaTexto(-custoTotal),
          criadoEm: agora,
        },
      });

      return {
        ...montarTransacaoResposta(registro),
        contract: montarContratoDaCompra(contrato),
        club_cash: centavosParaMoeda(caixaDepois),
      };
    });
  }

  async vender(jogadorId: number): Promise<VendaResposta> {
    const agora = new Date();

    return this.prisma.$transaction(async (transacao) => {
      await this.travarJogador(transacao, jogadorId);
      const jogador = await this.buscarJogadorAtivo(transacao, jogadorId);
      if (jogador.clubeId === null) {
        throw new ConflictException('Jogador livre não pode ser vendido.');
      }

      await this.travarClube(transacao, jogador.clubeId);
      const clube = await this.buscarClube(transacao, jogador.clubeId);
      const contrato = await transacao.contrato.findFirst({
        where: { jogadorId, clubeId: clube.id, situacao: 'ATIVO' },
      });
      if (!contrato) {
        throw new ConflictException('O jogador não tem contrato ativo com o clube.');
      }

      const valorDeVenda = valorDeMercadoEmCentavos(jogador);
      const valorDeCompra = decimalParaCentavos(contrato.valorCompra);
      const diasRestantes = calcularDiasRestantes(contrato.fidelidadeAte, agora);
      const percentualDaMulta = calcularPercentualDaMulta(diasRestantes);
      const multa = calcularMulta(valorDeVenda, percentualDaMulta);
      const lucro = valorDeVenda - valorDeCompra;
      const comissao = calcularComissao(lucro);
      const credito = valorDeVenda - multa - comissao;
      const situacaoDoContrato = multa > 0 ? 'RESCINDIDO' : 'ENCERRADO';

      await transacao.contrato.update({
        where: { id: contrato.id },
        data: { situacao: situacaoDoContrato, encerradoEm: agora },
      });
      await transacao.escalacao.deleteMany({ where: { jogadorId } });
      await transacao.jogador.update({ where: { id: jogadorId }, data: { clubeId: null } });
      const caixaDepois = decimalParaCentavos(clube.caixa) + credito;
      await transacao.clube.update({ where: { id: clube.id }, data: { caixa: centavosParaTexto(caixaDepois) } });
      const registro = await transacao.transacao.create({
        data: {
          clubeId: clube.id,
          jogadorId,
          nomeJogador: jogador.nome,
          tipo: 'VENDA',
          valor: centavosParaTexto(valorDeVenda),
          taxa: centavosParaTexto(comissao),
          multa: centavosParaTexto(multa),
          lucro: centavosParaTexto(lucro),
          variacaoCaixa: centavosParaTexto(credito),
          criadoEm: agora,
        },
      });

      return {
        ...montarTransacaoResposta(registro),
        purchase_value: centavosParaMoeda(valorDeCompra),
        remaining_days: diasRestantes,
        penalty_rate: percentualDaMulta,
        contract_status: situacaoDoContrato,
        club_cash: centavosParaMoeda(caixaDepois),
      };
    });
  }

  private validarFimDaFidelidade(texto: string, agora: Date): Date {
    const fim = lerDataDeBrasilia(texto);
    if (!fim) {
      throw new BadRequestException('loyalty_until deve estar no formato AAAA-MM-DDTHH:MM-03:00.');
    }
    const limite = agora.getTime() + PRAZO_MAXIMO_DA_FIDELIDADE_EM_DIAS * MILISSEGUNDOS_POR_DIA;
    if (fim.getTime() <= agora.getTime()) {
      throw new BadRequestException('loyalty_until deve ser uma data futura.');
    }
    if (fim.getTime() > limite) {
      throw new BadRequestException(`loyalty_until não pode passar de ${PRAZO_MAXIMO_DA_FIDELIDADE_EM_DIAS} dias.`);
    }
    return fim;
  }

  private async travarJogador(transacao: Prisma.TransactionClient, jogadorId: number): Promise<void> {
    await transacao.$queryRaw(Prisma.sql`SELECT id FROM jogadores WHERE id = ${jogadorId}::int FOR UPDATE`);
  }

  private async travarClube(transacao: Prisma.TransactionClient, clubeId: number): Promise<void> {
    await transacao.$queryRaw(Prisma.sql`SELECT id FROM clubes WHERE id = ${clubeId}::int FOR UPDATE`);
  }

  private async buscarJogadorAtivo(transacao: Prisma.TransactionClient, jogadorId: number): Promise<Jogador> {
    const jogador = await transacao.jogador.findFirst({ where: { id: jogadorId, excluidoEm: null } });
    if (!jogador) {
      throw new NotFoundException('Jogador não encontrado.');
    }
    return jogador;
  }

  private async buscarClube(transacao: Prisma.TransactionClient, clubeId: number): Promise<Clube> {
    const clube = await transacao.clube.findUnique({ where: { id: clubeId } });
    if (!clube) {
      throw new NotFoundException('Clube não encontrado.');
    }
    return clube;
  }
}