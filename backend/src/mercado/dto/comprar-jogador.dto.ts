import { DataDeBrasilia, InteiroEntre } from '../../comum/validacoes';

const MAIOR_INTEIRO = 2147483647;

export class ComprarJogadorDto {
  @InteiroEntre(1, MAIOR_INTEIRO)
  club_id!: number;

  @DataDeBrasilia()
  loyalty_until!: string;
}