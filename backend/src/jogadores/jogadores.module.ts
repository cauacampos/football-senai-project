import { Module } from '@nestjs/common';
import { JogadoresService } from './jogadores.service';
import { JogadoresController } from './jogadores.controller';

@Module({
  controllers: [JogadoresController],
  providers: [JogadoresService],
})
export class JogadoresModule {}
