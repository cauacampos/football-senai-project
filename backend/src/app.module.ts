import { Module } from '@nestjs/common';
import { JogadoresModule } from './jogadores/jogadores.module';
import { PrismaModule } from './prisma/prisma.module';
import { ClubesModule } from './clubes/clubes.module';
import { MercadoModule } from './mercado/mercado.module';

@Module({
  imports: [PrismaModule, JogadoresModule, ClubesModule, MercadoModule],
})
export class AppModule {}
