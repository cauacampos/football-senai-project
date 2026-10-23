import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateClubeDto, siglaCorrespondeAoNome } from './create-clube.dto';

function validar(corpo: Record<string, unknown>) {
  const dto = plainToInstance(CreateClubeDto, corpo);
  return { dto, mensagens: validateSync(dto, { whitelist: true }).flatMap((erro) => Object.values(erro.constraints ?? {})) };
}

function aceita(corpo: Record<string, unknown>) {
  expect(validar(corpo).mensagens).toEqual([]);
}

function recusa(corpo: Record<string, unknown>) {
  expect(validar(corpo).mensagens.length).toBeGreaterThan(0);
}

describe('CriarClubeDto', () => {
  it('aceita o exemplo do enunciado e normaliza o nome', () => {
    aceita({ name: 'Águias FC', acronym: 'AGU' });
    expect(validar({ name: '  Águias   FC ', acronym: 'AGU' }).dto.name).toBe('Águias FC');
  });

  describe('name', () => {
    it.each([
      ['uma palavra só', 'Aguias'],
      ['6 palavras', 'Um Dois Tres Quatro Cinco Seis'],
      ['dígito', 'Águias FC 2'],
      ['símbolo', 'Águias & Cia'],
      ['tabulação', 'Águias\tFC'],
      ['apóstrofo', "D'Ouro FC"],
      ['mais de 60 caracteres', `${'a'.repeat(30)} ${'b'.repeat(30)}`],
      ['só espaços', '     '],
      ['número', 10],
      ['nulo', null],
    ])('recusa nome com %s', (_descricao, name) => {
      recusa({ name, acronym: 'AGU' });
    });

    it.each(['Sport Club do Recife', 'Atlético-MG Futebol', 'São Paulo F.C.', 'A B'])('aceita %s', (name) => {
      const sigla = name.normalize('NFD').replace(/[^A-Za-z]/g, '').toUpperCase();
      const acronym = `${sigla[0]}${sigla[1]}${sigla[2]}`;
      const { mensagens } = validar({ name, acronym: acronym === 'ABB' ? 'AB' : acronym });
      expect(mensagens.filter((mensagem) => mensagem.startsWith('name'))).toEqual([]);
    });

    it('aceita 60 caracteres e 5 palavras', () => {
      const nome = `${'a'.repeat(28)} ${'b'.repeat(29)}`;
      expect(nome).toHaveLength(58);
      expect(validar({ name: `${nome}  `, acronym: 'AAB' }).mensagens).toEqual([]);
      aceita({ name: 'Real Atlético Clube Bom Jesus', acronym: 'RAC' });
    });
  });

  describe('acronym', () => {
    it.each(['AG', 'AGUI', 'agu', 'Agu', 'ÁGU', 'A1U', 'AG ', '', null, 7])('recusa formato %p', (acronym) => {
      recusa({ name: 'Águias FC', acronym });
    });

    it('exige a primeira letra do nome e as outras na ordem em que aparecem', () => {
      aceita({ name: 'Águias FC', acronym: 'AGU' });
      aceita({ name: 'Águias FC', acronym: 'AFC' });
      aceita({ name: 'Águias FC', acronym: 'AIS' });
      recusa({ name: 'Águias FC', acronym: 'GAU' });
      recusa({ name: 'Águias FC', acronym: 'AUG' });
      recusa({ name: 'Águias FC', acronym: 'XYZ' });
    });

    it('recusa três letras iguais', () => {
      recusa({ name: 'Aaa Aaa', acronym: 'AAA' });
    });

    it('compara sem diferenciar acentos nem maiúsculas', () => {
      expect(siglaCorrespondeAoNome('SPC', 'são paulo club')).toBe(true);
      expect(siglaCorrespondeAoNome('CAE', 'Ceará Esporte')).toBe(true);
    });

    it('recusa clube sem sigla', () => {
      recusa({ name: 'Águias FC' });
    });
  });
});