import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ListarJogadoresQueryDto, lerOrdenacao } from './listar-jogadores-query.dto';

function mensagens(consulta: Record<string, unknown>): string[] {
  const dto = plainToInstance(ListarJogadoresQueryDto, consulta);
  return validateSync(dto, { whitelist: true }).flatMap((erro) => Object.values(erro.constraints ?? {}));
}

function aceita(consulta: Record<string, unknown>) {
  expect(mensagens(consulta)).toEqual([]);
}

function recusa(consulta: Record<string, unknown>) {
  expect(mensagens(consulta).length).toBeGreaterThan(0);
}

describe('ListarJogadoresQueryDto', () => {
  it('aceita a consulta sem parâmetros e ignora parâmetros desconhecidos', () => {
    aceita({});
    const dto = plainToInstance(ListarJogadoresQueryDto, { search: 'lua', foo: 'bar' });
    expect(validateSync(dto, { whitelist: true })).toEqual([]);
    expect(dto).not.toHaveProperty('foo');
  });

  it('recusa parâmetro presente com valor vazio', () => {
    ['search', 'position', 'condition', 'free', 'club_id', 'min_age', 'max_age', 'min_value', 'max_value', 'sort', 'page', 'limit'].forEach(
      (parametro) => recusa({ [parametro]: '' }),
    );
  });

  it('recusa parâmetro repetido (vira lista)', () => {
    recusa({ position: ['MEI', 'ATA'] });
    recusa({ page: ['1', '2'] });
  });

  describe('search', () => {
    it('aceita de 2 a 100 caracteres', () => {
      aceita({ search: 'ab' });
      aceita({ search: 'a'.repeat(100) });
    });
    it('recusa 1 e 101 caracteres', () => {
      recusa({ search: 'a' });
      recusa({ search: 'a'.repeat(101) });
    });
  });

  describe('position, condition e free', () => {
    it('aceitam só os valores exatos', () => {
      ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'].forEach((position) => aceita({ position }));
      ['mei', 'Mei', 'XXX'].forEach((position) => recusa({ position }));
      ['APTO', 'MAL_CONDICIONADO', 'DOENTE'].forEach((condition) => aceita({ condition }));
      ['apto', 'MAL CONDICIONADO'].forEach((condition) => recusa({ condition }));
      ['true', 'false'].forEach((free) => aceita({ free }));
      ['TRUE', 'False', '1', 'yes'].forEach((free) => recusa({ free }));
    });
  });

  describe('inteiros', () => {
    it.each(['club_id', 'page'])('%s aceita só dígitos positivos sem zero à esquerda', (parametro) => {
      ['1', '25', '2147483647'].forEach((valor) => aceita({ [parametro]: valor }));
      ['0', '-1', '+1', '01', '1.5', '1e3', '2147483648', ' 1', '1 ', 'abc', 1].forEach((valor) =>
        recusa({ [parametro]: valor }),
      );
    });

    it('limit vai de 1 a 50', () => {
      ['1', '10', '50'].forEach((limit) => aceita({ limit }));
      ['0', '51', '-5', '010'].forEach((limit) => recusa({ limit }));
    });
  });

  describe('faixa de idade', () => {
    it('aceita de 16 a 45, com um ou os dois limites', () => {
      aceita({ min_age: '16' });
      aceita({ max_age: '45' });
      aceita({ min_age: '20', max_age: '20' });
    });
    it('recusa fora da faixa e min_age maior que max_age', () => {
      recusa({ min_age: '15' });
      recusa({ max_age: '46' });
      recusa({ min_age: '30', max_age: '20' });
    });
  });

  describe('faixa de valor', () => {
    it('aceita decimais de 0 a 550 com até 2 casas', () => {
      ['0', '0.5', '10', '10.5', '10.55', '550'].forEach((min_value) => aceita({ min_value }));
      aceita({ min_value: '10', max_value: '10' });
    });
    it('recusa formas inválidas, fora da faixa e min_value maior que max_value', () => {
      ['550.01', '551', '10.555', '-1', '+1', '1e2', '10,5', '010', '.5', '10.', 'abc'].forEach((max_value) =>
        recusa({ max_value }),
      );
      recusa({ min_value: '20', max_value: '10.5' });
    });
  });

  describe('sort', () => {
    it('aceita um ou dois critérios de campos diferentes', () => {
      ['name', 'value_asc', 'value_desc', 'age_asc', 'age_desc', 'position', 'name,age_desc', 'value_asc,age_desc'].forEach(
        (sort) => aceita({ sort }),
      );
    });
    it('recusa campo repetido, mais de dois critérios, espaços e maiúsculas', () => {
      ['value_asc,value_desc', 'name,name', 'name,age_desc,position', 'name, age_asc', 'POSITION', 'name,', 'altura'].forEach(
        (sort) => recusa({ sort }),
      );
    });
    it('lerOrdenacao devolve os critérios na ordem informada', () => {
      expect(lerOrdenacao('age_desc,value_asc')).toEqual(['age_desc', 'value_asc']);
      expect(lerOrdenacao('value_asc,value_desc')).toBeNull();
    });
  });

  describe('combinações', () => {
    it('recusa free=true com club_id, mas aceita free=false com club_id', () => {
      recusa({ free: 'true', club_id: '1' });
      aceita({ free: 'false', club_id: '1' });
    });
  });
});