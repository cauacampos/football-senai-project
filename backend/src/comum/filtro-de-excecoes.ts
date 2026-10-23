import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Response } from 'express';

const MENSAGEM_ERRO_INTERNO = 'Erro interno do servidor.';

function extrairMensagem(excecao: HttpException): string {
  const resposta = excecao.getResponse();
  if (typeof resposta === 'string') {
    return resposta;
  }
  const mensagem = (resposta as { message?: string | string[] }).message;
  if (Array.isArray(mensagem)) {
    return [...new Set(mensagem)].join('; ');
  }
  return mensagem ?? excecao.message;
}

@Catch()
export class FiltroDeExcecoes implements ExceptionFilter {
  private readonly logger = new Logger(FiltroDeExcecoes.name);

  catch(excecao: unknown, host: ArgumentsHost): void {
    const resposta = host.switchToHttp().getResponse<Response>();

    if (excecao instanceof HttpException) {
      resposta.status(excecao.getStatus()).json({ message: extrairMensagem(excecao) });
      return;
    }

    this.logger.error(excecao);
    resposta.status(500).json({ message: MENSAGEM_ERRO_INTERNO });
  }
}