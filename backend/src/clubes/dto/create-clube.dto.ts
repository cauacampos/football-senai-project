import { IsString, Matches } from 'class-validator';
import { NormalizarTexto, QuantidadeDePalavras, ValidarNoObjeto } from '../../comum/validacoes';

const FORMATO_DA_SIGLA = /^[A-Z]{3}$/;

function removerAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/\p{M}/gu, '');
}

export function siglaCorrespondeAoNome(sigla: string, nome: string): boolean {
  const letrasDoNome = removerAcentos(nome).toUpperCase().replace(/[^A-Z]/g, '');
  if (letrasDoNome[0] !== sigla[0]) {
    return false;
  }
  let posicaoInicial = 1;
  for (const letra of sigla.slice(1)) {
    const posicaoEncontrada = letrasDoNome.indexOf(letra, posicaoInicial);
    if (posicaoEncontrada === -1) {
      return false;
    }
    posicaoInicial = posicaoEncontrada + 1;
  }
  return true;
}

function siglaTemFormatoValido(sigla: unknown): sigla is string {
  return typeof sigla === 'string' && FORMATO_DA_SIGLA.test(sigla);
}

function siglaAparecendoNoNome(sigla: unknown, clube: CreateClubeDto): boolean {
  if (!siglaTemFormatoValido(sigla) || typeof clube.name !== 'string') {
    return true;
  }
  return siglaCorrespondeAoNome(sigla, clube.name);
}

function siglaComLetrasDiferentes(sigla: unknown): boolean {
  return !siglaTemFormatoValido(sigla) || new Set(sigla).size > 1;
}

export class CreateClubeDto {
  @NormalizarTexto()
  @IsString()
  @Matches(/^[\p{L} .-]+$/u, { message: 'name só pode ter letras, espaços, hífen e ponto' })
  @Matches(/^.{3,60}$/su, { message: 'name deve ter de 3 a 60 caracteres' })
  @QuantidadeDePalavras(2, 5, 'name deve ter de 2 a 5 palavras')
  name!: string;

  @IsString()
  @Matches(FORMATO_DA_SIGLA, { message: 'acronym deve ter exatamente 3 letras de A a Z, maiúsculas e sem acento' })
  @ValidarNoObjeto<CreateClubeDto>(
    'siglaAparecendoNoNome',
    'acronym deve começar pela primeira letra do name e ter as outras letras no name, na mesma ordem',
    siglaAparecendoNoNome,
  )
  @ValidarNoObjeto<CreateClubeDto>(
    'siglaComLetrasDiferentes',
    'as três letras do acronym não podem ser todas iguais',
    siglaComLetrasDiferentes,
  )
  acronym!: string;
}