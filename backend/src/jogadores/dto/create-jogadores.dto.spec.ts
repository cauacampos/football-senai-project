import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateJogadoresDto } from './create-jogadores.dto';

const corpoValido = {
  name: 'Carlos Silva',
  position: 'MEI',
  agility: 70,
  age: 25,
  pace: 68,
  shooting: 65,
  passing: 80,
  dribbling: 78,
  defending: 52,
  physical: 60,
  potential: 86,
};

function validar(alteracoes: Record<string, unknown>) {
  const dto = plainToInstance(CreateJogadoresDto, { ...corpoValido, ...alteracoes });
  const erros = validateSync(dto, { whitelist: true });
  return { dto, mensagens: erros.flatMap((erro) => Object.values(erro.constraints ?? {})) };
}

function semCampo(campo: string) {
  const { [campo]: _removido, ...restante } = corpoValido as Record<string, unknown>;
  const erros = validateSync(plainToInstance(CreateJogadoresDto, restante), { whitelist: true });
  return erros.length;
}

describe('CreateJogadoresDto', () => {
  it('aceita um cadastro válido', () => {
    expect(validar({}).mensagens).toEqual([]);
  });

  describe('name', () => {
    it('remove espaços nas pontas e repetidos', () => {
      const { dto, mensagens } = validar({ name: '  Meia   Zeta ' });
      expect(mensagens).toEqual([]);
      expect(dto.name).toBe('Meia Zeta');
    });

    it.each([
      ['uma palavra só', 'Carlos'],
      ['menos de 3 caracteres', 'A'],
      ['com dígito', 'Carlos Silva 2'],
      ['com tabulação', 'Carlos\tSilva'],
      ['com quebra de linha', 'Carlos\nSilva'],
      ['só espaços', '     '],
      ['mais de 100 caracteres', `${'a'.repeat(50)} ${'b'.repeat(50)}`],
      ['sem letras nas palavras', '- -'],
      ['número', 10],
      ['nulo', null],
    ])('recusa nome %s', (_descricao, name) => {
      expect(validar({ name }).mensagens.length).toBeGreaterThan(0);
    });

    it('aceita 3 e 100 caracteres', () => {
      expect(validar({ name: 'A B' }).mensagens).toEqual([]);
      expect(validar({ name: `${'a'.repeat(49)} ${'b'.repeat(50)}` }).mensagens).toEqual([]);
    });

    it('aceita acentos', () => {
      expect(validar({ name: 'João Épsilon' }).mensagens).toEqual([]);
    });
  });

  describe('position', () => {
    it.each(['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'])('aceita %s', (position) => {
      expect(validar({ position }).mensagens).toEqual([]);
    });

    it.each(['ata', 'XXX', '', null, 1])('recusa %p', (position) => {
      expect(validar({ position }).mensagens.length).toBeGreaterThan(0);
    });
  });

  describe('agility e age', () => {
    it.each([0, 101, 50.5, '50', null])('recusa agility %p', (agility) => {
      expect(validar({ agility }).mensagens.length).toBeGreaterThan(0);
    });

    it('aceita agility 1, 100 e 50.0 (inteiro)', () => {
      expect(validar({ agility: 1 }).mensagens).toEqual([]);
      expect(validar({ agility: 100 }).mensagens).toEqual([]);
      expect(validar({ agility: 50.0 }).mensagens).toEqual([]);
    });

    it.each([15, 46, 20.5, '20', null])('recusa age %p', (age) => {
      expect(validar({ age }).mensagens.length).toBeGreaterThan(0);
    });

    it('aceita age 16 e 45', () => {
      expect(validar({ age: 16 }).mensagens).toEqual([]);
      expect(validar({ age: 45, potential: 80 }).mensagens).toEqual([]);
    });

    it('limita agility a 85 com 35 anos ou mais', () => {
      expect(validar({ age: 35, agility: 85, potential: 80 }).mensagens).toEqual([]);
      expect(validar({ age: 35, agility: 86, potential: 80 }).mensagens.length).toBeGreaterThan(0);
      expect(validar({ age: 34, agility: 100, potential: 80 }).mensagens).toEqual([]);
    });
  });

  describe('atributos', () => {
    it.each(['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'])('valida %s de 1 a 99', (campo) => {
      expect(validar({ [campo]: 0 }).mensagens.length).toBeGreaterThan(0);
      expect(validar({ [campo]: 100 }).mensagens.length).toBeGreaterThan(0);
      expect(validar({ [campo]: '10' }).mensagens.length).toBeGreaterThan(0);
      expect(validar({ [campo]: 10.5 }).mensagens.length).toBeGreaterThan(0);
      expect(validar({ [campo]: 1 }).mensagens).toEqual([]);
    });

    it('aceita soma 480 e recusa 481', () => {
      const oitenta = { pace: 80, shooting: 80, passing: 80, dribbling: 80, defending: 80, physical: 80 };
      expect(validar({ ...oitenta, potential: 80 }).mensagens).toEqual([]);
      expect(validar({ ...oitenta, physical: 81, potential: 81 }).mensagens.length).toBeGreaterThan(0);
    });
  });

  describe('potential', () => {
    it('recusa potential menor que o maior atributo e fora de 1 a 99', () => {
      expect(validar({ potential: 79 }).mensagens.length).toBeGreaterThan(0);
      expect(validar({ potential: 100 }).mensagens.length).toBeGreaterThan(0);
      expect(validar({ potential: 0 }).mensagens.length).toBeGreaterThan(0);
      expect(validar({ potential: 80 }).mensagens).toEqual([]);
    });

    it('exige potential igual ao maior atributo a partir de 33 anos', () => {
      expect(validar({ age: 33, potential: 80 }).mensagens).toEqual([]);
      expect(validar({ age: 33, potential: 81 }).mensagens.length).toBeGreaterThan(0);
      expect(validar({ age: 32, potential: 81 }).mensagens).toEqual([]);
    });
  });

  describe('campos obrigatórios e controlados pelo sistema', () => {
    it.each(Object.keys(corpoValido))('recusa cadastro sem %s', (campo) => {
      expect(semCampo(campo)).toBeGreaterThan(0);
    });

    it('descarta campos que a API calcula ou controla', () => {
      const { dto } = validar({ base_value: 99, overall: 99, condition: 'DOENTE', club_id: 1, id: 7, market_value: 5 });
      const camposControlados = ['base_value', 'overall', 'condition', 'club_id', 'id', 'market_value'];
      camposControlados.forEach((campo) => expect(dto).not.toHaveProperty(campo));
    });
  });
});