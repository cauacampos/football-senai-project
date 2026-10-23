import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Jogador } from '@prisma/client';
import { centavosParaTexto } from '../comum/moeda';
import { PrismaService } from '../prisma/prisma.service';
import { calcularOverall, calcularValorBase } from './calculo-jogador';
import { buscarIdsDaPagina, contarJogadores, criarFiltros } from './consulta-jogadores';
import { UpdateCondicaoDto } from './dto/update-condicao.dto';
import { UpdateJogadoresDto } from './dto/update-jogadores.dto';
import { CreateJogadoresDto } from './dto/create-jogadores.dto';
import { ListarJogadoresQueryDto } from './dto/listar-jogadores-query.dto';
import { JogadorResposta, montarJogadorResposta } from './jogadores-resposta';

export interface PaginaDeJogadores {
  data: JogadorResposta[];
  meta: { page: number; limit: number; total_items: number; total_pages: number };
}

@Injectable()
export class JogadoresService {
  constructor(private readonly prisma: PrismaService) {}

  async cadastrar(dto: CreateJogadoresDto): Promise<JogadorResposta> {
    const overall = calcularOverall(dto.position, {
      velocidade: dto.pace,
      finalizacao: dto.shooting,
      passe: dto.passing,
      drible: dto.dribbling,
      defesa: dto.defending,
      fisico: dto.physical,
    });
    const valorBase = calcularValorBase({ overall, potencial: dto.potential, idade: dto.age });

    const jogador = await this.prisma.jogador.create({
      data: {
        nome: dto.name,
        posicao: dto.position,
        agilidade: dto.agility,
        idade: dto.age,
        valorBase: centavosParaTexto(valorBase),
        velocidade: dto.pace,
        finalizacao: dto.shooting,
        passe: dto.passing,
        drible: dto.dribbling,
        defesa: dto.defending,
        fisico: dto.physical,
        potencial: dto.potential,
      },
    });
    return montarJogadorResposta(jogador);
  }

  async listar(consulta: ListarJogadoresQueryDto): Promise<PaginaDeJogadores> {
    const filtros = criarFiltros(consulta);
    if (filtros.clubeId !== undefined) {
      await this.garantirClubeExistente(filtros.clubeId);
    }

    const totalDeItens = await contarJogadores(this.prisma, filtros);
    const ids = await buscarIdsDaPagina(this.prisma, filtros);
    const jogadores = ids.length > 0 ? await this.prisma.jogador.findMany({ where: { id: { in: ids } } }) : [];
    const jogadorPorId = new Map(jogadores.map((jogador) => [jogador.id, jogador]));

    return {
      data: ids.flatMap((id) => {
        const jogador = jogadorPorId.get(id);
        return jogador ? [montarJogadorResposta(jogador)] : [];
      }),
      meta: {
        page: filtros.pagina,
        limit: filtros.limite,
        total_items: totalDeItens,
        total_pages: Math.ceil(totalDeItens / filtros.limite),
      },
    };
  }

  async buscarPorId(id: number): Promise<JogadorResposta> {
    return montarJogadorResposta(await this.buscarJogadorAtivo(id));
  }

  async editar(id: number, dto: UpdateJogadoresDto): Promise<JogadorResposta> {
    const atual = await this.buscarJogadorAtivo(id);
    if (atual.clubeId !== null && atual.posicao !== dto.position) {
      throw new ConflictException('Jogador com clube não pode mudar de posição.');
    }
    if (dto.age < atual.idade) {
      throw new ConflictException('A idade não pode ser menor que a idade atual.');
    }

    const atualizado = await this.prisma.jogador.update({
      where: { id },
      data: { nome: dto.name, posicao: dto.position, agilidade: dto.agility, idade: dto.age },
    });
    return montarJogadorResposta(atualizado);
  }

  async updateCondicao(id: number, dto: UpdateCondicaoDto): Promise<JogadorResposta> {
    const atual = await this.buscarJogadorAtivo(id);
    if (atual.condicao === dto.condition) {
      return montarJogadorResposta(atual);
    }
    if (atual.condicao === 'DOENTE' && dto.condition === 'APTO') {
      throw new ConflictException('Jogador DOENTE não pode voltar direto para APTO.');
    }

    const atualizado = await this.prisma.$transaction(async (transacao) => {
      if (dto.condition === 'DOENTE') {
        await transacao.escalacao.deleteMany({ where: { jogadorId: id } });
      }
      return transacao.jogador.update({ where: { id }, data: { condicao: dto.condition } });
    });
    return montarJogadorResposta(atualizado);
  }

  async excluir(id: number): Promise<void> {
    const atual = await this.buscarJogadorAtivo(id);
    if (atual.clubeId !== null) {
      throw new ConflictException('Só jogador livre pode ser excluído.');
    }
    await this.prisma.jogador.update({ where: { id }, data: { excluidoEm: new Date() } });
  }

  private async garantirClubeExistente(clubeId: number): Promise<void> {
    const clube = await this.prisma.clube.findUnique({ where: { id: clubeId }, select: { id: true } });
    if (!clube) {
      throw new NotFoundException('Clube não encontrado.');
    }
  }

  private async buscarJogadorAtivo(id: number): Promise<Jogador> {
    const jogador = await this.prisma.jogador.findFirst({ where: { id, excluidoEm: null } });
    if (!jogador) {
      throw new NotFoundException('Jogador não encontrado.');
    }
    return jogador;
  }
}