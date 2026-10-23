import { formatarDataDeBrasilia } from './data-hora';

describe('formatarDataDeBrasilia', () => {
  it('converte UTC para o horário de Brasília', () => {
    expect(formatarDataDeBrasilia(new Date('2027-03-02T13:15:00Z'))).toBe('2027-03-02T10:15:00-03:00');
  });

  it('muda o dia quando o UTC já passou da meia-noite', () => {
    expect(formatarDataDeBrasilia(new Date('2027-03-02T02:00:00Z'))).toBe('2027-03-01T23:00:00-03:00');
  });

  it('mantém os segundos', () => {
    expect(formatarDataDeBrasilia(new Date('2027-01-01T03:00:59Z'))).toBe('2027-01-01T00:00:59-03:00');
  });
});