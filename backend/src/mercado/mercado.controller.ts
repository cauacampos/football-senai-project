import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { IdDaUrl } from '../comum/id-da-url.decorator';
import { ComprarJogadorDto } from './dto/comprar-jogador.dto';
import { MercadoService } from './mercado.service';
import { CompraResposta, VendaResposta } from './transacao-resposta';

@Controller('players')
export class MercadoController {
  constructor(private readonly mercadoService: MercadoService) {}

  @Post(':id/buy')
  @HttpCode(200)
  comprar(@IdDaUrl() id: number, @Body() dto: ComprarJogadorDto): Promise<CompraResposta> {
    return this.mercadoService.comprar(id, dto);
  }

  @Post(':id/sell')
  @HttpCode(200)
  vender(@IdDaUrl() id: number): Promise<VendaResposta> {
    return this.mercadoService.vender(id);
  }
}