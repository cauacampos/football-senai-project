export function dividirArredondando(numerador: number, denominador: number): number {
  return Math.floor((numerador * 2 + denominador) / (denominador * 2));
}