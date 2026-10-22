import type { Prisma } from '@prisma/client';

export function decimalParaCentavos(valor: Prisma.Decimal): number {
  return valor.times(100).toNumber();
}

export function centavosParaMoeda(centavos: number): number {
  return centavos / 100;
}

export function centavosParaTexto(centavos: number): string {
  return (centavos / 100).toFixed(2);
}