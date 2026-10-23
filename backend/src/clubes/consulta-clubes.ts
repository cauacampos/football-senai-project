import { Prisma } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import { VALOR_DE_MERCADO_EM_CENTAVOS_SQL } from '../jogadores/valor-mercado-sql';
import type { OrdenacaoDeClubes } from './dto/list-clubes-query.dto';

export interface ClubeComValorDoElenco {
  id: number;
  valorDoElencoEmCentavos: number;
}

const VALOR_DO_ELENCO_SQL = `COALESCE(SUM(CASE WHEN j.id IS NULL THEN 0 ELSE ${VALOR_DE_MERCADO_EM_CENTAVOS_SQL} END), 0)`;
const NOME_EM_ORDEM = 'lower(unaccent(c.nome)) ASC, c.nome ASC';
const PATRIMONIO_SQL = `(ROUND(c.caixa * 100)::bigint + ${VALOR_DO_ELENCO_SQL})`;

const ORDENACAO_SQL: Record<OrdenacaoDeClubes, string> = {
  name: NOME_EM_ORDEM,
  net_worth_asc: `${PATRIMONIO_SQL} ASC, ${NOME_EM_ORDEM}`,
  net_worth_desc: `${PATRIMONIO_SQL} DESC, ${NOME_EM_ORDEM}`,
};

export async function listarClubesComValorDoElenco(
  prisma: PrismaService,
  ordenacao: OrdenacaoDeClubes,
): Promise<ClubeComValorDoElenco[]> {
  const linhas = await prisma.$queryRaw<{ id: number; valor_do_elenco: number }[]>(
    Prisma.sql`
      SELECT c.id, ${Prisma.raw(VALOR_DO_ELENCO_SQL)}::int AS valor_do_elenco
      FROM clubes c
      LEFT JOIN jogadores j ON j.clube_id = c.id AND j.excluido_em IS NULL
      GROUP BY c.id
      ORDER BY ${Prisma.raw(ORDENACAO_SQL[ordenacao])}, c.id ASC`,
  );
  return linhas.map((linha) => ({ id: linha.id, valorDoElencoEmCentavos: linha.valor_do_elenco }));
}