import { IsOptional } from 'class-validator';
import { InteiroEmTexto, ValidarNoObjeto } from '../../comum/validacoes';

export const TIPOS_DE_TRANSACAO = ['COMPRA', 'VENDA'] as const;
export type TipoDeTransacao = (typeof TIPOS_DE_TRANSACAO)[number];

const MAIOR_INTEIRO = 2147483647;

export function lerTipos(texto: string): TipoDeTransacao[] | null {
  const tipos = texto.split(',');
  const todosConhecidos = tipos.every((tipo) => (TIPOS_DE_TRANSACAO as readonly string[]).includes(tipo));
  const semRepeticao = new Set(tipos).size === tipos.length;
  return todosConhecidos && semRepeticao ? (tipos as TipoDeTransacao[]) : null;
}

function tiposValidos(valor: unknown): boolean {
  return typeof valor === 'string' && lerTipos(valor) !== null;
}

export class HistoricoQueryDto {
  @IsOptional()
  @ValidarNoObjeto<HistoricoQueryDto>(
    'tiposValidos',
    'type deve ter COMPRA, VENDA ou os dois, separados por vírgula, sem espaços e sem repetição',
    tiposValidos,
  )
  type?: string;

  @IsOptional()
  @InteiroEmTexto(1, MAIOR_INTEIRO)
  player_id?: string;
}