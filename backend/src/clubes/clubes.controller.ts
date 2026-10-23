import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PREFIXO_DA_API } from '../comum/constants';
import { IdDaUrl } from '../comum/id-da-url.decorator';
import { ClubeDetalhadoResposta, ClubeResposta } from './clubes-resposta';
import { ClubesService } from './clubes.service';
import { CreateClubeDto } from './dto/create-clube.dto';
import { ListClubesQueryDto } from './dto/list-clubes-query.dto';

@Controller('clubs')
export class ClubesController {
  constructor(private readonly clubesService: ClubesService) {}

  @Post()
  async criar(@Body() dto: CreateClubeDto, @Res({ passthrough: true }) resposta: Response): Promise<ClubeResposta> {
    const clube = await this.clubesService.criar(dto);
    resposta.location(`/${PREFIXO_DA_API}/clubs/${clube.id}`);
    return clube;
  }

  @Get()
  listar(@Query() consulta: ListClubesQueryDto): Promise<ClubeResposta[]> {
    return this.clubesService.listar(consulta.sort);
  }

  @Get(':id')
  buscarPorId(@IdDaUrl() id: number): Promise<ClubeDetalhadoResposta> {
    return this.clubesService.buscarPorId(id);
  }
}