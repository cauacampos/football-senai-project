import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExigirCorpoObjetoGuard } from './comum/exigir-corpo-objeto.guard';
import { FiltroDeExcecoes } from './comum/filtro-de-excecoes';
import { registrarRequisicao } from './comum/registro-de-requisicoes.middleware';

const ORIGEM_PADRAO_DO_FRONTEND = 'http://localhost:3000';
const PORTA_PADRAO = 3001;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? ORIGEM_PADRAO_DO_FRONTEND,
    exposedHeaders: ['Location', 'Content-Disposition'],
  });
  app.use(registrarRequisicao);
  app.useGlobalFilters(new FiltroDeExcecoes());
  app.useGlobalGuards(new ExigirCorpoObjetoGuard());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(process.env.PORT ?? PORTA_PADRAO);
}
void bootstrap();