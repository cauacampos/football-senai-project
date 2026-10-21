import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJogadoresDto } from './dto/create-jogadores.dto';
import { UpdateJogadoresDto } from './dto/update-jogadores.dto';

@Injectable()
export class JogadoresService {
  constructor(private readonly prisma: PrismaService) {}

  async createJogador(dto: CreateJogadoresDto) {
    const { clubeId, ...dados } = dto;

    if (clubeId !== undefined) {
      const clube = await this.prisma.clube.findUnique({
        where: { id: clubeId },
      });

      if (!clube) {
        throw new BadRequestException(
          `O clube com ID ${clubeId} não existe.`,
        );
      }
    }

    return this.prisma.jogador.create({
      data: {
        ...dados,
        ...(clubeId !== undefined
          ? { clube: { connect: { id: clubeId } } }
          : {}),
      },
    });
  }

  async getJogadores() {
    return this.prisma.jogador.findMany({
      where: { excluidoEm: null },
      orderBy: { id: 'asc' },
      include: { clube: true },
    });
  }

  async getJogadorById(id: number) {
    const jogador = await this.prisma.jogador.findFirst({
      where: {
        id,
        excluidoEm: null,
      },
      include: { clube: true },
    });

    if (!jogador) {
      throw new NotFoundException(
        `Jogador com ID ${id} não encontrado.`,
      );
    }

    return jogador;
  }

  async patchJogador(id: number, dto: UpdateJogadoresDto) {
    await this.getJogadorById(id);

    const { clubeId, ...dados } = dto;

    if (clubeId !== undefined) {
      const clube = await this.prisma.clube.findUnique({
        where: { id: clubeId },
      });

      if (!clube) {
        throw new BadRequestException(
          `O clube com ID ${clubeId} não existe.`,
        );
      }
    }

    return this.prisma.jogador.update({
      where: { id },
      data: {
        ...dados,
        ...(clubeId !== undefined
          ? { clube: { connect: { id: clubeId } } }
          : {}),
      },
    });
  }

  async deleteJogador(id: number) {
    await this.getJogadorById(id);

    return this.prisma.jogador.update({
      where: { id },
      data: {
        excluidoEm: new Date(),
      },
    });
  }
}