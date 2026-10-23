import { Prisma } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import { ListarJogadoresQueryDto, OpcaoDeOrdenacao, lerOrdenacao } from './dto/listar-jogadores-query.dto';
import { POSICOES } from '../comum/tipos-jogador';
import { VALOR_DE_MERCADO_EM_CENTAVOS_SQL } from './valor-mercado-sql';

const ORDENACAO_PADRAO: OpcaoDeOrdenacao[] = ['name'];
const PAGINA_PADRAO = 1;
const LIMITE_PADRAO = 10;

export interface FiltrosDeJogadores {
  busca?: string;
  posicao?: string;
  condicao?: string;
  livre?: boolean;
  clubeId?: number;
  idadeMinima?: number;
  idadeMaxima?: number;
  valorMinimoEmCentavos?: number;
  valorMaximoEmCentavos?: number;
  ordenacao: OpcaoDeOrdenacao[];
  pagina: number;
  limite: number;
}

const POSICAO_EM_ORDEM = `CASE j.posicao ${POSICOES.map((posicao, indice) => `WHEN '${posicao}' THEN ${indice}`).join(' ')} END`;

const NOME_EM_ORDEM = 'lower(unaccent(j.nome)) ASC, j.nome ASC';

const ORDENACAO_SQL: Record<OpcaoDeOrdenacao, string> = {
  name: NOME_EM_ORDEM,
  value_asc: `${VALOR_DE_MERCADO_EM_CENTAVOS_SQL} ASC`,
  value_desc: `${VALOR_DE_MERCADO_EM_CENTAVOS_SQL} DESC`,
  age_asc: 'j.idade ASC',
  age_desc: 'j.idade DESC',
  position: `${POSICAO_EM_ORDEM} ASC`,
};

function paraNumero(texto: string | undefined): number | undefined {
  return texto === undefined ? undefined : Number(texto);
}

function paraCentavos(texto: string | undefined): number | undefined {
  return texto === undefined ? undefined : Math.round(Number(texto) * 100);
}

export function criarFiltros(consulta: ListarJogadoresQueryDto): FiltrosDeJogadores {
  return {
    busca: consulta.search,
    posicao: consulta.position,
    condicao: consulta.condition,
    livre: consulta.free === undefined ? undefined : consulta.free === 'true',
    clubeId: paraNumero(consulta.club_id),
    idadeMinima: paraNumero(consulta.min_age),
    idadeMaxima: paraNumero(consulta.max_age),
    valorMinimoEmCentavos: paraCentavos(consulta.min_value),
    valorMaximoEmCentavos: paraCentavos(consulta.max_value),
    ordenacao: consulta.sort === undefined ? ORDENACAO_PADRAO : (lerOrdenacao(consulta.sort) ?? ORDENACAO_PADRAO),
    pagina: paraNumero(consulta.page) ?? PAGINA_PADRAO,
    limite: paraNumero(consulta.limit) ?? LIMITE_PADRAO,
  };
}

function montarCondicoes(filtros: FiltrosDeJogadores): Prisma.Sql {
  const valorDeMercado = Prisma.raw(VALOR_DE_MERCADO_EM_CENTAVOS_SQL);
  const condicoes: Prisma.Sql[] = [Prisma.sql`j.excluido_em IS NULL`];

  if (filtros.busca !== undefined) {
    condicoes.push(Prisma.sql`position(lower(unaccent(${filtros.busca}::text)) in lower(unaccent(j.nome))) > 0`);
  }
  if (filtros.posicao !== undefined) {
    condicoes.push(Prisma.sql`j.posicao = ${filtros.posicao}`);
  }
  if (filtros.condicao !== undefined) {
    condicoes.push(Prisma.sql`j.condicao = ${filtros.condicao}`);
  }
  if (filtros.livre !== undefined) {
    condicoes.push(filtros.livre ? Prisma.sql`j.clube_id IS NULL` : Prisma.sql`j.clube_id IS NOT NULL`);
  }
  if (filtros.clubeId !== undefined) {
    condicoes.push(Prisma.sql`j.clube_id = ${filtros.clubeId}::int`);
  }
  if (filtros.idadeMinima !== undefined) {
    condicoes.push(Prisma.sql`j.idade >= ${filtros.idadeMinima}::int`);
  }
  if (filtros.idadeMaxima !== undefined) {
    condicoes.push(Prisma.sql`j.idade <= ${filtros.idadeMaxima}::int`);
  }
  if (filtros.valorMinimoEmCentavos !== undefined) {
    condicoes.push(Prisma.sql`${valorDeMercado} >= ${filtros.valorMinimoEmCentavos}::bigint`);
  }
  if (filtros.valorMaximoEmCentavos !== undefined) {
    condicoes.push(Prisma.sql`${valorDeMercado} <= ${filtros.valorMaximoEmCentavos}::bigint`);
  }
  return Prisma.join(condicoes, ' AND ');
}

export async function contarJogadores(prisma: PrismaService, filtros: FiltrosDeJogadores): Promise<number> {
  const linhas = await prisma.$queryRaw<{ total: number }[]>(
    Prisma.sql`SELECT COUNT(*)::int AS total FROM jogadores j WHERE ${montarCondicoes(filtros)}`,
  );
  return linhas[0].total;
}

export async function buscarIdsDaPagina(prisma: PrismaService, filtros: FiltrosDeJogadores): Promise<number[]> {
  const ordenacao = Prisma.raw([...filtros.ordenacao.map((opcao) => ORDENACAO_SQL[opcao]), NOME_EM_ORDEM, 'j.id ASC'].join(', '));
  const deslocamento = (filtros.pagina - 1) * filtros.limite;
  const linhas = await prisma.$queryRaw<{ id: number }[]>(
    Prisma.sql`SELECT j.id FROM jogadores j WHERE ${montarCondicoes(filtros)} ORDER BY ${ordenacao} LIMIT ${filtros.limite}::int OFFSET ${deslocamento}::bigint`,
  );
  return linhas.map((linha) => linha.id);
}