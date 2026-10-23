import { calcularDiasRestantes, calcularPercentualDaMulta } from './calculo-contrato';

const AGORA = new Date('2026-11-02T13:15:00Z');

function depoisDeAgora(dias: number, horas = 0, minutos = 0): Date {
  return new Date(AGORA.getTime() + ((dias * 24 + horas) * 60 + minutos) * 60 * 1000);
}

describe('calcularDiasRestantes', () => {
  it.each([
    ['já passou', depoisDeAgora(-3), 0],
    ['é o próprio momento', depoisDeAgora(0), 0],
    ['1 minuto', depoisDeAgora(0, 0, 1), 1],
    ['10 dias e 2 horas', depoisDeAgora(10, 2), 11],
    ['exatamente 30 dias', depoisDeAgora(30), 30],
    ['30 dias e 1 minuto', depoisDeAgora(30, 0, 1), 31],
    ['exatamente 180 dias', depoisDeAgora(180), 180],
    ['180 dias e 1 minuto', depoisDeAgora(180, 0, 1), 181],
    ['116 dias, 17 horas e 35 minutos', depoisDeAgora(116, 17, 35), 117],
    ['exatamente 120 dias', depoisDeAgora(120), 120],
  ])('%s', (_descricao, fim, esperado) => {
    expect(calcularDiasRestantes(fim, AGORA)).toBe(esperado);
  });
});

describe('calcularPercentualDaMulta', () => {
  it.each([
    [0, 0],
    [1, 5],
    [11, 5],
    [30, 5],
    [31, 10],
    [120, 10],
    [180, 10],
    [181, 20],
    [200, 20],
    [1095, 20],
  ])('%i dias restantes → %i%%', (dias, esperado) => {
    expect(calcularPercentualDaMulta(dias)).toBe(esperado);
  });
});