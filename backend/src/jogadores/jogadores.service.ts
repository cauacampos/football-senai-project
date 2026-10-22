import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Jogador } from '@prisma/client';
import { centavosParaTexto } from '../comum/moeda';
import { PrismaService } from '../prisma/prisma.service';
import { calcularOverall, calcularValorBase } from './calculo-jogador';
import { UpdateCondicaoDto } from './dto/update-condicao.dto';
import { UpdateJogadoresDto } from './dto/update-jogadores.dto';
import { CreateJogadoresDto } from './dto/create-jogadores.dto';
import { JogadorResposta, montarJogadorResposta } from './jogadores-resposta';

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

  async alterarCondicao(id: number, dto: UpdateCondicaoDto): Promise<JogadorResposta> {
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

  private async buscarJogadorAtivo(id: number): Promise<Jogador> {
    const jogador = await this.prisma.jogador.findFirst({ where: { id, excluidoEm: null } });
    if (!jogador) {
      throw new NotFoundException('Jogador não encontrado.');
    }
    return jogador;
  }
}