import { Atributos, calcularOverall, calcularValorBase, calcularValorDeMercado } from './calculo-jogador';
import type { Condicao, Posicao } from './tipos-jogador';

describe('calcularOverall', () => {
  const casos: Array<[Posicao, Atributos, number]> = [
    ['MEI', { velocidade: 68, finalizacao: 65, passe: 80, drible: 78, defesa: 52, fisico: 60 }, 73],
    ['ATA', { velocidade: 78, finalizacao: 75, passe: 73, drible: 82, defesa: 48, fisico: 68 }, 76],
    ['LAT', { velocidade: 72, finalizacao: 70, passe: 78, drible: 76, defesa: 70, fisico: 66 }, 72],
    ['ZAG', { velocidade: 50, finalizacao: 90, passe: 60, drible: 40, defesa: 80, fisico: 75 }, 73],
    ['GOL', { velocidade: 55, finalizacao: 30, passe: 65, drible: 40, defesa: 72, fisico: 68 }, 68],
  ];

  it.each(casos)('posição %s', (posicao, atributos, esperado) => {
    expect(calcularOverall(posicao, atributos)).toBe(esperado);
  });
});

describe('calcularValorBase (em centavos)', () => {
  const casos: Array<[number, number, number, number]> = [
    [75, 86, 25, 4000],
    [60, 70, 30, 1000],
    [61, 70, 30, 1200],
    [76, 80, 22, 4600],
    [85, 92, 27, 10000],
    [70, 84, 21, 3420],
    [70, 84, 22, 3000],
    [45, 90, 18, 363],
    [40, 66, 36, 100],
  ];

  it.each(casos)('overall %i, potencial %i, idade %i', (overall, potencial, idade, esperado) => {
    expect(calcularValorBase({ overall, potencial, idade })).toBe(esperado);
  });
});

describe('calcularValorDeMercado (em centavos)', () => {
  const casos: Array<[number, Condicao, number, number, number]> = [
    [8200, 'APTO', 20, 25, 8200],
    [8200, 'APTO', 50, 19, 9020],
    [8200, 'MAL_CONDICIONADO', 50, 25, 6970],
    [8200, 'MAL_CONDICIONADO', 80, 21, 8405],
    [8200, 'MAL_CONDICIONADO', 30, 33, 5330],
    [8200, 'DOENTE', 90, 25, 6970],
    [8200, 'DOENTE', 30, 25, 4920],
    [8200, 'DOENTE', 10, 40, 4920],
    [950, 'MAL_CONDICIONADO', 85, 25, 879],
    [100, 'MAL_CONDICIONADO', 50, 35, 100],
  ];

  it.each(casos)(
    'valor base %i, %s, agilidade %i, idade %i',
    (valorBase, condicao, agilidade, idade, esperado) => {
      expect(calcularValorDeMercado(valorBase, condicao, agilidade, idade)).toBe(esperado);
    },
  );
});