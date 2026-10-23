import { ConflictException, NotFoundException } from '@nestjs/common';
import type { Clube, Contrato, Jogador } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import { ClubesService } from './clubes.service';

function decimal(valor: number): Clube['caixa'] {
  return { times: (fator: number) => ({ toNumber: () => Math.round(valor * fator) }) } as unknown as Clube['caixa'];
}

const aguias = { id: 1, nome: 'Águias FC', nomeNormalizado: 'águias fc', sigla: 'AGU', caixa: decimal(261.15), formacao: null } as unknown as Clube;

const meiaLua = {
  id: 2,
  nome: 'Meia Lua',
  posicao: 'MEI',
  agilidade: 85,
  idade: 25,
  valorBase: decimal(40),
  condicao: 'MAL_CONDICIONADO',
  clubeId: 1,
  velocidade: 70,
  finalizacao: 68,
  passe: 82,
  drible: 79,
  defesa: 55,
  fisico: 64,
  potencial: 86,
} as unknown as Jogador;

function contratoComFim(fidelidadeAte: Date): Contrato {
  return { jogadorId: 2, clubeId: 1, valorCompra: decimal(37), fidelidadeAte, situacao: 'ATIVO' } as unknown as Contrato;
}

interface Cenario {
  clubes?: Clube[];
  total?: number;
  jogadores?: Jogador[];
  contratos?: Contrato[];
  idsDoElenco?: number[];
  linhasDaListagem?: { id: number; valor_do_elenco: number }[];
}

function criarServico(cenario: Cenario = {}) {
  const clubes = cenario.clubes ?? [];
  const criados: Record<string, unknown>[] = [];
  const prisma = {
    clube: {
      count: async () => cenario.total ?? clubes.length,
      findUnique: async ({ where }: { where: { id?: number; nomeNormalizado?: string; sigla?: string } }) =>
        clubes.find(
          (clube) => clube.id === where.id || clube.nomeNormalizado === where.nomeNormalizado || clube.sigla === where.sigla,
        ) ?? null,
      findMany: async () => clubes,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        criados.push(data);
        return { id: 7, ...data, caixa: decimal(Number(data.caixa)) };
      },
    },
    jogador: { findMany: async () => cenario.jogadores ?? [] },
    contrato: { findMany: async () => cenario.contratos ?? [] },
    $queryRaw: async (consulta: { text: string }) =>
      consulta.text.includes('valor_do_elenco')
        ? (cenario.linhasDaListagem ?? [])
        : (cenario.idsDoElenco ?? []).map((id) => ({ id })),
    $transaction: async (funcao: (transacao: unknown) => unknown) => funcao(prisma),
  };
  return { servico: new ClubesService(prisma as unknown as PrismaService), criados };
}

describe('ClubesService', () => {
  describe('criar', () => {
    it('cria o clube com 300,00 de caixa e nome normalizado', async () => {
      const { servico, criados } = criarServico();
      const resposta = await servico.criar({ name: 'Águias FC', acronym: 'AGU' });
      expect(criados[0]).toEqual({ nome: 'Águias FC', nomeNormalizado: 'águias fc', sigla: 'AGU', caixa: '300.00' });
      expect(resposta).toEqual({ id: 7, name: 'Águias FC', acronym: 'AGU', cash: 300, squad_value: 0, net_worth: 300 });
    });

    it('recusa nome repetido ignorando maiúsculas, mas aceita o mesmo nome sem acento', async () => {
      const { servico } = criarServico({ clubes: [aguias] });
      await expect(servico.criar({ name: 'ÁGUIAS fc', acronym: 'AFC' })).rejects.toBeInstanceOf(ConflictException);
      await expect(servico.criar({ name: 'Aguias FC', acronym: 'AFC' })).resolves.toMatchObject({ name: 'Aguias FC' });
    });

    it('recusa sigla repetida', async () => {
      const { servico, criados } = criarServico({ clubes: [aguias] });
      await expect(servico.criar({ name: 'Atlético Guará', acronym: 'AGU' })).rejects.toBeInstanceOf(ConflictException);
      expect(criados).toHaveLength(0);
    });

    it('recusa o 21º clube e aceita o 20º', async () => {
      await expect(criarServico({ total: 20 }).servico.criar({ name: 'Águias FC', acronym: 'AGU' })).rejects.toBeInstanceOf(
        ConflictException,
      );
      await expect(criarServico({ total: 19 }).servico.criar({ name: 'Águias FC', acronym: 'AGU' })).resolves.toBeDefined();
    });
  });

  describe('listar', () => {
    it('calcula o patrimônio com o caixa e o valor do elenco, na ordem da consulta', async () => {
      const outro = { ...aguias, id: 2, nome: 'Bravos FC', sigla: 'BRA', caixa: decimal(300) } as unknown as Clube;
      const { servico } = criarServico({
        clubes: [aguias, outro],
        linhasDaListagem: [
          { id: 2, valor_do_elenco: 0 },
          { id: 1, valor_do_elenco: 3700 },
        ],
      });
      expect(await servico.listar('net_worth_desc')).toEqual([
        { id: 2, name: 'Bravos FC', acronym: 'BRA', cash: 300, squad_value: 0, net_worth: 300 },
        { id: 1, name: 'Águias FC', acronym: 'AGU', cash: 261.15, squad_value: 37, net_worth: 298.15 },
      ]);
    });

    it('devolve lista vazia sem clubes', async () => {
      expect(await criarServico().servico.listar()).toEqual([]);
    });
  });

  describe('buscarPorId', () => {
    it('responde 404 para clube inexistente', async () => {
      await expect(criarServico().servico.buscarPorId(9)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('monta o elenco com contrato, valor do elenco e patrimônio (exemplo 2.2.2)', async () => {
      const fim = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000 - 60 * 1000);
      const { servico } = criarServico({
        clubes: [aguias],
        jogadores: [meiaLua],
        idsDoElenco: [2],
        contratos: [contratoComFim(fim)],
      });

      const resposta = await servico.buscarPorId(1);

      expect(resposta).toMatchObject({ id: 1, name: 'Águias FC', acronym: 'AGU', cash: 261.15, squad_value: 37, net_worth: 298.15 });
      expect(resposta.players).toHaveLength(1);
      expect(resposta.players[0]).toMatchObject({
        id: 2,
        market_value: 37,
        club_id: 1,
        contract: { purchase_value: 37, remaining_days: 120, penalty_rate: 10 },
      });
      expect(resposta.players[0].contract?.loyalty_until).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-03:00$/);
    });

    it('mostra clube sem jogadores com valor do elenco zero', async () => {
      const resposta = await criarServico({ clubes: [aguias] }).servico.buscarPorId(1);
      expect(resposta).toMatchObject({ squad_value: 0, net_worth: 261.15, players: [] });
    });
  });
});