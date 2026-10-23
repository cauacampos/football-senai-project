import { Module } from '@nestjs/common';
import { HistoricoController } from './historico.controller';
import { HistoricoService } from './historico.service';
import { MercadoController } from './mercado.controller';
import { MercadoService } from './mercado.service';

@Module({
  controllers: [MercadoController, HistoricoController],
  providers: [MercadoService, HistoricoService],
})
export class MercadoModule {}