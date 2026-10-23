import { ExecutionContext, NotFoundException, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';

const ID_MAXIMO = 2147483647;
const FORMATO_ID = /^[1-9]\d*$/;

export const IdDaUrl = createParamDecorator((nomeDoParametro: string | undefined, contexto: ExecutionContext): number => {
  const requisicao = contexto.switchToHttp().getRequest<Request>();
  const valor = String(requisicao.params[nomeDoParametro ?? 'id']);
  if (!FORMATO_ID.test(valor) || Number(valor) > ID_MAXIMO) {
    throw new NotFoundException('Recurso não encontrado.');
  }
  return Number(valor);
});