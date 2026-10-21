import { BadRequestException, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class ExigirCorpoObjetoGuard implements CanActivate {
  canActivate(contexto: ExecutionContext): boolean {
    const { body } = contexto.switchToHttp().getRequest<Request>();
    const corpoInvalido = body !== undefined && (body === null || typeof body !== 'object' || Array.isArray(body));
    if (corpoInvalido) {
      throw new BadRequestException('O corpo da requisição deve ser um objeto JSON.');
    }
    return true;
  }
}