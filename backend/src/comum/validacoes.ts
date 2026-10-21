import { Transform } from 'class-transformer';
import { IsInt, Max, Min, ValidationArguments, registerDecorator } from 'class-validator';

export function contarPalavras(texto: string): number {
  return texto.split(' ').filter((parte) => /\p{L}/u.test(parte)).length;
}

export function NormalizarTexto(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/^ +| +$/g, '').replace(/ {2,}/g, ' ') : value,
  );
}

export function InteiroEntre(minimo: number, maximo: number) {
  const mensagem = `$property deve ser um número inteiro de ${minimo} a ${maximo}`;
  return (alvo: object, propriedade: string): void => {
    IsInt({ message: mensagem })(alvo, propriedade);
    Min(minimo, { message: mensagem })(alvo, propriedade);
    Max(maximo, { message: mensagem })(alvo, propriedade);
  };
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