import { IsIn, IsOptional, Matches } from 'class-validator';
import { DecimalEmTexto, InteiroEmTexto, ValidarNoObjeto } from '../../comum/validacoes';
import { CONDICOES, POSICOES } from '../../comum/tipos-jogador';

export const OPCOES_DE_ORDENACAO = ['name', 'value_asc', 'value_desc', 'age_asc', 'age_desc', 'position'] as const;
export type OpcaoDeOrdenacao = (typeof OPCOES_DE_ORDENACAO)[number];

const CAMPO_DA_ORDENACAO: Record<OpcaoDeOrdenacao, string> = {
  name: 'name',
  value_asc: 'value',
  value_desc: 'value',
  age_asc: 'age',
  age_desc: 'age',
  position: 'position',
};

const MAXIMO_DE_CRITERIOS = 2;
const MAIOR_INTEIRO = 2147483647;
const IDADE_MINIMA = 16;
const IDADE_MAXIMA = 45;
const VALOR_MAXIMO = 550;

export function lerOrdenacao(texto: string): OpcaoDeOrdenacao[] | null {
  const opcoes = texto.split(',');
  const todasConhecidas = opcoes.every((opcao) => (OPCOES_DE_ORDENACAO as readonly string[]).includes(opcao));
  if (!todasConhecidas || opcoes.length > MAXIMO_DE_CRITERIOS) {
    return null;
  }
  const criterios = opcoes as OpcaoDeOrdenacao[];
  const campos = new Set(criterios.map((criterio) => CAMPO_DA_ORDENACAO[criterio]));
  return campos.size === criterios.length ? criterios : null;
}

function ordenacaoValida(valor: unknown): boolean {
  return typeof valor === 'string' && lerOrdenacao(valor) !== null;
}

function idadeMinimaNaoPassaDaMaxima(maxima: unknown, consulta: ListarJogadoresQueryDto): boolean {
  if (typeof maxima !== 'string' || typeof consulta.min_age !== 'string') {
    return true;
  }
  return Number(consulta.min_age) <= Number(maxima);
}

function valorMinimoNaoPassaDoMaximo(maximo: unknown, consulta: ListarJogadoresQueryDto): boolean {
  if (typeof maximo !== 'string' || typeof consulta.min_value !== 'string') {
    return true;
  }
  return Number(consulta.min_value) <= Number(maximo);
}

function livreNaoCombinaComClube(livre: unknown, consulta: ListarJogadoresQueryDto): boolean {
  return !(livre === 'true' && consulta.club_id !== undefined);
}

export class ListarJogadoresQueryDto {
  @IsOptional()
  @Matches(/^.{2,100}$/su, { message: 'search deve ter de 2 a 100 caracteres' })
  search?: string;

  @IsOptional()
  @IsIn(POSICOES, { message: 'position deve ser GOL, ZAG, LAT, MEI ou ATA' })
  position?: string;

  @IsOptional()
  @IsIn(CONDICOES, { message: 'condition deve ser APTO, MAL_CONDICIONADO ou DOENTE' })
  condition?: string;

  @IsOptional()
  @IsIn(['true', 'false'], { message: 'free deve ser true ou false' })
  @ValidarNoObjeto<ListarJogadoresQueryDto>(
    'livreNaoCombinaComClube',
    'free=true não pode ser combinado com club_id',
    livreNaoCombinaComClube,
  )
  free?: string;

  @IsOptional()
  @InteiroEmTexto(1, MAIOR_INTEIRO)
  club_id?: string;

  @IsOptional()
  @InteiroEmTexto(IDADE_MINIMA, IDADE_MAXIMA)
  min_age?: string;

  @IsOptional()
  @InteiroEmTexto(IDADE_MINIMA, IDADE_MAXIMA)
  @ValidarNoObjeto<ListarJogadoresQueryDto>(
    'idadeMinimaNaoPassaDaMaxima',
    'min_age não pode ser maior que max_age',
    idadeMinimaNaoPassaDaMaxima,
  )
  max_age?: string;

  @IsOptional()
  @DecimalEmTexto(0, VALOR_MAXIMO)
  min_value?: string;

  @IsOptional()
  @DecimalEmTexto(0, VALOR_MAXIMO)
  @ValidarNoObjeto<ListarJogadoresQueryDto>(
    'valorMinimoNaoPassaDoMaximo',
    'min_value não pode ser maior que max_value',
    valorMinimoNaoPassaDoMaximo,
  )
  max_value?: string;

  @IsOptional()
  @ValidarNoObjeto<ListarJogadoresQueryDto>(
    'ordenacaoValida',
    'sort deve ter até dois critérios entre name, value_asc, value_desc, age_asc, age_desc e position, separados por vírgula, sem espaços e sem repetir o campo',
    ordenacaoValida,
  )
  sort?: string;

  @IsOptional()
  @InteiroEmTexto(1, MAIOR_INTEIRO)
  page?: string;

  @IsOptional()
  @InteiroEmTexto(1, 50)
  limit?: string;
}