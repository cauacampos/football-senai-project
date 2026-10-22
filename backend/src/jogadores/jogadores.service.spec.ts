import { ConflictException, NotFoundException } from '@nestjs/common';
import type { Jogador } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import type { CreateJogadoresDto } from './dto/create-jogadores.dto';
import { JogadoresService } from './jogadores.service';

type DadosGravados = Record<string, unknown>;

function decimal(valor: number): Jogador['valorBase'] {
  return { times: (fator: number) => ({ toNumber: () => valor * fator }) } as unknown as Jogador['valorBase'];
}

const meiaLua = {
  id: 2,
  nome: 'Meia Lua',
  posicao: 'MEI',
  agilidade: 85,
  idade: 25,
  valorBase: decimal(40),
  condicao: 'APTO',
  clubeId: null,
  velocidade: 70,
  finalizacao: 68,
  passe: 82,
  drible: 79,
  defesa: 55,
  fisico: 64,
  potencial: 86,
  excluidoEm: null,
} as unknown as Jogador;

function criarPrismaFalso(jogadorExistente: Jogador | null) {
  const registro = { gravacoes: [] as DadosGravados[], escalacoesRemovidas: [] as unknown[] };
  const prisma = {
    jogador: {
      findFirst: async () => jogadorExistente,
      create: async ({ data }: { data: DadosGravados }) => {
        registro.gravacoes.push(data);
        return { ...meiaLua, ...data, valorBase: decimal(Number(data.valorBase)) };
      },
      update: async ({ data }: { data: DadosGravados }) => {
        registro.gravacoes.push(data);
        return { ...jogadorExistente, ...data };
      },
    },
    escalacao: {
      deleteMany: async (argumentos: unknown) => {
        registro.escalacoesRemovidas.push(argumentos);
        return { count: 1 };
      },
    },
    $transaction: async (funcao: (transacao: unknown) => unknown) => funcao(prisma),
  };
  return { servico: new JogadoresService(prisma as unknown as PrismaService), registro };
}

describe('JogadoresService', () => {
  describe('cadastrar', () => {
    it('calcula e grava o valor base, e responde com overall e valor de mercado', async () => {
      const { servico, registro } = criarPrismaFalso(null);
      const dto = {
        name: 'Meia Lua',
        position: 'MEI',
        agility: 85,
        age: 25,
        pace: 70,
        shooting: 68,
        passing: 82,
        dribbling: 79,
        defending: 55,
        physical: 64,
        potential: 86,
      } as CreateJogadoresDto;

      const resposta = await servico.cadastrar(dto);

      expect(registro.gravacoes[0].valorBase).toBe('40.00');
      expect(resposta).toMatchObject({
        name: 'Meia Lua',
        condition: 'APTO',
        base_value: 40,
        market_value: 40,
        overall: 75,
        club_id: null,
      });
    });
  });

  describe('buscarPorId', () => {
    it('responde 404 quando o jogador não existe ou foi excluído', async () => {
      const { servico } = criarPrismaFalso(null);
      await expect(servico.buscarPorId(9)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('calcula o valor de mercado na hora', async () => {
      const { servico } = criarPrismaFalso({ ...meiaLua, condicao: 'MAL_CONDICIONADO' });
      const resposta = await servico.buscarPorId(2);
      expect(resposta.market_value).toBe(37);
      expect(resposta.base_value).toBe(40);
    });
  });

  describe('editar', () => {
    const edicao = { name: 'Meia Lua', position: 'MEI', agility: 85, age: 26 } as const;

    it('muda nome, posição, agilidade e idade', async () => {
      const { servico, registro } = criarPrismaFalso(meiaLua);
      const resposta = await servico.editar(2, { ...edicao, position: 'ATA' });
      expect(registro.gravacoes[0]).toEqual({ nome: 'Meia Lua', posicao: 'ATA', agilidade: 85, idade: 26 });
      expect(resposta.base_value).toBe(40);
    });

    it('recusa mudar a posição de jogador com clube', async () => {
      const { servico, registro } = criarPrismaFalso({ ...meiaLua, clubeId: 1 });
      await expect(servico.editar(2, { ...edicao, position: 'ATA' })).rejects.toBeInstanceOf(ConflictException);
      expect(registro.gravacoes).toHaveLength(0);
    });

    it('aceita editar jogador com clube sem mudar a posição', async () => {
      const { servico } = criarPrismaFalso({ ...meiaLua, clubeId: 1 });
      await expect(servico.editar(2, edicao)).resolves.toMatchObject({ club_id: 1 });
    });

    it('recusa idade menor que a atual e aceita a mesma idade', async () => {
      const { servico, registro } = criarPrismaFalso(meiaLua);
      await expect(servico.editar(2, { ...edicao, age: 24 })).rejects.toBeInstanceOf(ConflictException);
      expect(registro.gravacoes).toHaveLength(0);
      await expect(servico.editar(2, { ...edicao, age: 25 })).resolves.toMatchObject({ age: 25 });
    });
  });

  describe('alterarCondicao', () => {
    it('muda a condição e recalcula o valor de mercado', async () => {
      const { servico } = criarPrismaFalso(meiaLua);
      const resposta = await servico.alterarCondicao(2, { condition: 'MAL_CONDICIONADO' });
      expect(resposta.condition).toBe('MAL_CONDICIONADO');
      expect(resposta.market_value).toBe(37);
    });

    it('aceita a condição atual sem gravar nada', async () => {
      const { servico, registro } = criarPrismaFalso(meiaLua);
      await servico.alterarCondicao(2, { condition: 'APTO' });
      expect(registro.gravacoes).toHaveLength(0);
    });

    it('recusa DOENTE direto para APTO', async () => {
      const { servico, registro } = criarPrismaFalso({ ...meiaLua, condicao: 'DOENTE' });
      await expect(servico.alterarCondicao(2, { condition: 'APTO' })).rejects.toBeInstanceOf(ConflictException);
      expect(registro.gravacoes).toHaveLength(0);
    });

    it('permite DOENTE para MAL_CONDICIONADO', async () => {
      const { servico } = criarPrismaFalso({ ...meiaLua, condicao: 'DOENTE' });
      await expect(servico.alterarCondicao(2, { condition: 'MAL_CONDICIONADO' })).resolves.toMatchObject({
        condition: 'MAL_CONDICIONADO',
      });
    });

    it('tira o jogador da escalação ao ficar DOENTE, na mesma operação', async () => {
      const { servico, registro } = criarPrismaFalso(meiaLua);
      await servico.alterarCondicao(2, { condition: 'DOENTE' });
      expect(registro.escalacoesRemovidas).toEqual([{ where: { jogadorId: 2 } }]);
      expect(registro.gravacoes).toEqual([{ condicao: 'DOENTE' }]);
    });

    it('não mexe na escalação quando a nova condição não é DOENTE', async () => {
      const { servico, registro } = criarPrismaFalso(meiaLua);
      await servico.alterarCondicao(2, { condition: 'MAL_CONDICIONADO' });
      expect(registro.escalacoesRemovidas).toHaveLength(0);
    });
  });

  describe('excluir', () => {
    it('marca o jogador livre como excluído', async () => {
      const { servico, registro } = criarPrismaFalso(meiaLua);
      await servico.excluir(2);
      expect(registro.gravacoes[0].excluidoEm).toBeInstanceOf(Date);
    });

    it('recusa excluir jogador que está num clube', async () => {
      const { servico, registro } = criarPrismaFalso({ ...meiaLua, clubeId: 1 });
      await expect(servico.excluir(2)).rejects.toBeInstanceOf(ConflictException);
      expect(registro.gravacoes).toHaveLength(0);
    });

    it('responde 404 quando o jogador não existe', async () => {
      const { servico } = criarPrismaFalso(null);
      await expect(servico.excluir(2)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});