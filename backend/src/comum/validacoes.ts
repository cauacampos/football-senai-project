import { Transform } from 'class-transformer';
import { ValidationArguments, registerDecorator } from 'class-validator';

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