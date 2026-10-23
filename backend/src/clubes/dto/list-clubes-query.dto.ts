import { IsIn, IsOptional } from 'class-validator';

export const ORDENACOES_DE_CLUBES = ['name', 'net_worth_asc', 'net_worth_desc'] as const;
export type OrdenacaoDeClubes = (typeof ORDENACOES_DE_CLUBES)[number];

export class ListClubesQueryDto {
  @IsOptional()
  @IsIn(ORDENACOES_DE_CLUBES, { message: 'sort deve ser name, net_worth_asc ou net_worth_desc' })
  sort?: OrdenacaoDeClubes;
}