import { Body, Controller, Delete, Get, HttpCode, Patch, Post, Put, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PREFIXO_DA_API } from '../comum/constants';
import { IdDaUrl } from '../comum/id-da-url.decorator';
import { UpdateCondicaoDto } from './dto/update-condicao.dto';
import { UpdateJogadoresDto } from './dto/update-jogadores.dto';
import { CreateJogadoresDto } from './dto/create-jogadores.dto';
import { JogadorResposta } from './jogadores-resposta';
import { JogadoresService } from './jogadores.service';

@Controller('players')
export class JogadoresController {
  constructor(private readonly jogadoresService: JogadoresService) {}

  @Post()
  async cadastrar(
    @Body() dto: CreateJogadoresDto,
    @Res({ passthrough: true }) resposta: Response,
  ): Promise<JogadorResposta> {
    const jogador = await this.jogadoresService.cadastrar(dto);
    resposta.location(`/${PREFIXO_DA_API}/players/${jogador.id}`);
    return jogador;
  }

  @Get(':id')
  buscarPorId(@IdDaUrl() id: number): Promise<JogadorResposta> {
    return this.jogadoresService.buscarPorId(id);
  }

  @Put(':id')
  editar(@IdDaUrl() id: number, @Body() dto: UpdateJogadoresDto): Promise<JogadorResposta> {
    return this.jogadoresService.editar(id, dto);
  }

  @Patch(':id/condition')
  alterarCondicao(@IdDaUrl() id: number, @Body() dto: UpdateCondicaoDto): Promise<JogadorResposta> {
    return this.jogadoresService.alterarCondicao(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  excluir(@IdDaUrl() id: number): Promise<void> {
    return this.jogadoresService.excluir(id);
  }
}