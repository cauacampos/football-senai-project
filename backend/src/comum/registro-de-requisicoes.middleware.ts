import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const logger = new Logger('HTTP');

export function registrarRequisicao(requisicao: Request, resposta: Response, proximo: NextFunction): void {
  resposta.on('finish', () => {
    logger.log(`${requisicao.method} ${requisicao.originalUrl} ${resposta.statusCode}`);
  });
  proximo();
}