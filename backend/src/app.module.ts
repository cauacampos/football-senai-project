import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JogadoresModule } from './jogadores/jogadores.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, JogadoresModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
