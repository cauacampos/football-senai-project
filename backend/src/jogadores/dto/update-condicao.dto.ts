import { IsIn } from 'class-validator';
import { CONDICOES } from '../tipos-jogador';
import type { Condicao } from '../tipos-jogador';

export class UpdateCondicaoDto {
  @IsIn(CONDICOES, { message: 'condition deve ser APTO, MAL_CONDICIONADO ou DOENTE' })
  condition!: Condicao;
}