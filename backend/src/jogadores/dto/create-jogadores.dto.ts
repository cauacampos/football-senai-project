import { IsIn, IsString, Matches } from 'class-validator';
import { InteiroEntre, NormalizarTexto, QuantidadeDePalavras, ValidarNoObjeto } from '../../comum/validacoes';
import { POSICOES } from '../tipos-jogador';
import type { Posicao } from '../tipos-jogador';

const ATRIBUTOS = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'] as const;
const SOMA_MAXIMA_DOS_ATRIBUTOS = 480;
const IDADE_MINIMA_PARA_LIMITAR_AGILIDADE = 35;
const AGILIDADE_MAXIMA_COM_IDADE_AVANCADA = 85;
const IDADE_MINIMA_PARA_POTENCIAL_FIXO = 33;

function lerAtributos(jogador: CreateJogadoresDto): number[] | null {
  const valores = ATRIBUTOS.map((atributo) => jogador[atributo]);
  return valores.every((valor) => Number.isInteger(valor)) ? valores : null;
}

function agilidadeCompativelComIdade(agilidade: unknown, jogador: CreateJogadoresDto): boolean {
  if (typeof agilidade !== 'number' || typeof jogador.age !== 'number') {
    return true;
  }
  return jogador.age < IDADE_MINIMA_PARA_LIMITAR_AGILIDADE || agilidade <= AGILIDADE_MAXIMA_COM_IDADE_AVANCADA;
}

function somaDosAtributosDentroDoLimite(_valor: unknown, jogador: CreateJogadoresDto): boolean {
  const atributos = lerAtributos(jogador);
  if (!atributos) {
    return true;
  }
  return atributos.reduce((soma, valor) => soma + valor, 0) <= SOMA_MAXIMA_DOS_ATRIBUTOS;
}

function potencialNaoMenorQueOsAtributos(potencial: unknown, jogador: CreateJogadoresDto): boolean {
  const atributos = lerAtributos(jogador);
  if (!atributos || typeof potencial !== 'number') {
    return true;
  }
  return potencial >= Math.max(...atributos);
}

function potencialIgualAoMaiorAtributoEmVeteranos(potencial: unknown, jogador: CreateJogadoresDto): boolean {
  const atributos = lerAtributos(jogador);
  if (!atributos || typeof potencial !== 'number' || typeof jogador.age !== 'number') {
    return true;
  }
  return jogador.age < IDADE_MINIMA_PARA_POTENCIAL_FIXO || potencial === Math.max(...atributos);
}

export class CreateJogadoresDto {
  @NormalizarTexto()
  @IsString()
  @Matches(/^[^\p{Cc}]*$/u, { message: 'name não pode conter caracteres de controle' })
  @Matches(/^.{3,100}$/su, { message: 'name deve ter de 3 a 100 caracteres' })
  @Matches(/^[^0-9]*$/, { message: 'name não pode conter dígitos' })
  @QuantidadeDePalavras(2, Number.POSITIVE_INFINITY, 'name deve ter pelo menos duas palavras')
  name!: string;

  @IsIn(POSICOES, { message: 'position deve ser GOL, ZAG, LAT, MEI ou ATA' })
  position!: Posicao;

  @InteiroEntre(1, 100)
  @ValidarNoObjeto<CreateJogadoresDto>(
    'agilidadeCompativelComIdade',
    'agility deve ser no máximo 85 para jogadores com 35 anos ou mais',
    agilidadeCompativelComIdade,
  )
  agility!: number;

  @InteiroEntre(16, 45)
  age!: number;

  @InteiroEntre(1, 99)
  @ValidarNoObjeto<CreateJogadoresDto>(
    'somaDosAtributosDentroDoLimite',
    'a soma dos seis atributos não pode passar de 480',
    somaDosAtributosDentroDoLimite,
  )
  pace!: number;

  @InteiroEntre(1, 99)
  shooting!: number;

  @InteiroEntre(1, 99)
  passing!: number;

  @InteiroEntre(1, 99)
  dribbling!: number;

  @InteiroEntre(1, 99)
  defending!: number;

  @InteiroEntre(1, 99)
  physical!: number;

  @InteiroEntre(1, 99)
  @ValidarNoObjeto<CreateJogadoresDto>(
    'potencialNaoMenorQueOsAtributos',
    'potential não pode ser menor que o maior dos seis atributos',
    potencialNaoMenorQueOsAtributos,
  )
  @ValidarNoObjeto<CreateJogadoresDto>(
    'potencialIgualAoMaiorAtributoEmVeteranos',
    'potential deve ser igual ao maior dos seis atributos para jogadores com 33 anos ou mais',
    potencialIgualAoMaiorAtributoEmVeteranos,
  )
  potential!: number;
}