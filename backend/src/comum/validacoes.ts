import { Transform } from 'class-transformer';
import { ValidationArguments, registerDecorator } from 'class-validator';
import { lerDataDeBrasilia } from './data-hora';

export function contarPalavras(texto: string): number {
  return texto.split(' ').filter((parte) => /\p{L}/u.test(parte)).length;
}

export function NormalizarTexto(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/^ +| +$/g, '').replace(/ {2,}/g, ' ') : value,
  );
}

export function InteiroEntre(minimo: number, maximo: number) {
  return (alvo: object, propriedade: string): void =>
    registerDecorator({
      name: 'inteiroEntre',
      target: alvo.constructor,
      propertyName: propriedade,
      options: { message: `$property deve ser um número inteiro de ${minimo} a ${maximo}` },
      validator: {
        validate: (valor: unknown) => typeof valor === 'number' && Number.isInteger(valor) && valor >= minimo && valor <= maximo,
      },
    });
}

export function QuantidadeDePalavras(minimo: number, maximo: number, mensagem: string) {
  return (alvo: object, propriedade: string): void =>
    registerDecorator({
      name: 'quantidadeDePalavras',
      target: alvo.constructor,
      propertyName: propriedade,
      options: { message: mensagem },
      validator: {
        validate: (valor: unknown) =>
          typeof valor === 'string' && contarPalavras(valor) >= minimo && contarPalavras(valor) <= maximo,
      },
    });
}

export function ValidarNoObjeto<T extends object>(
  nome: string,
  mensagem: string,
  regra: (valor: unknown, objeto: T) => boolean,
) {
  return (alvo: object, propriedade: string): void =>
    registerDecorator({
      name: nome,
      target: alvo.constructor,
      propertyName: propriedade,
      options: { message: mensagem },
      validator: {
        validate: (valor: unknown, argumentos: ValidationArguments) => regra(valor, argumentos.object as T),
      },
    });
}

const FORMATO_INTEIRO_POSITIVO = /^[1-9]\d*$/;
const FORMATO_DECIMAL = /^(0|[1-9]\d*)(\.\d{1,2})?$/;

export function InteiroEmTexto(minimo: number, maximo: number) {
  return (alvo: object, propriedade: string): void =>
    registerDecorator({
      name: 'inteiroEmTexto',
      target: alvo.constructor,
      propertyName: propriedade,
      options: { message: `$property deve ser um número inteiro de ${minimo} a ${maximo}, escrito só com dígitos` },
      validator: {
        validate: (valor: unknown) =>
          typeof valor === 'string' &&
          FORMATO_INTEIRO_POSITIVO.test(valor) &&
          Number(valor) >= minimo &&
          Number(valor) <= maximo,
      },
    });
}

export function DecimalEmTexto(minimo: number, maximo: number) {
  return (alvo: object, propriedade: string): void =>
    registerDecorator({
      name: 'decimalEmTexto',
      target: alvo.constructor,
      propertyName: propriedade,
      options: { message: `$property deve ser um decimal de ${minimo} a ${maximo}, com até 2 casas, como 10 ou 10.55` },
      validator: {
        validate: (valor: unknown) =>
          typeof valor === 'string' && FORMATO_DECIMAL.test(valor) && Number(valor) >= minimo && Number(valor) <= maximo,
      },
    });
}

export function DataDeBrasilia() {
  return (alvo: object, propriedade: string): void =>
    registerDecorator({
      name: 'dataDeBrasilia',
      target: alvo.constructor,
      propertyName: propriedade,
      options: { message: '$property deve estar no formato AAAA-MM-DDTHH:MM-03:00 e ser uma data e hora que existe' },
      validator: { validate: (valor: unknown) => typeof valor === 'string' && lerDataDeBrasilia(valor) !== null },
    });
}