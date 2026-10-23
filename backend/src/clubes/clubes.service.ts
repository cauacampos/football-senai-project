import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Contrato } from '@prisma/client';
import { calcularDiasRestantes, calcularPercentualDaMulta } from '../contratos/calculo-contrato';
import { formatarDataDeBrasilia } from '../comum/data-hora';
import { centavosParaMoeda, centavosParaTexto, decimalParaCentavos } from '../comum/moeda';
import { buscarIdsDaPagina } from '../jogadores/consulta-jogadores';
import { montarJogadorResposta } from '../jogadores/jogadores-resposta';
import { PrismaService } from '../prisma/prisma.service';
import { listarClubesComValorDoElenco } from './consulta-clubes';
import {
  ClubeDetalhadoResposta,
  ClubeResposta,
  ContratoResposta,
  JogadorDoElencoResposta,
  montarClubeResposta,
} from './clubes-resposta';
import { CreateClubeDto } from './dto/create-clube.dto';
import { OrdenacaoDeClubes } from './dto/list-clubes-query.dto';
import { CAIXA_INICIAL_EM_CENTAVOS, LIMITE_DE_CLUBES, LIMITE_DO_ELENCO } from './limites-clube';

const CODIGO_DE_VIOLACAO_DE_UNICIDADE = 'P2002';

function ehViolacaoDeUnicidade(erro: unknown): boolean {
  return typeof erro === 'object' && erro !== null && (erro as { code?: string }).code === CODIGO_DE_VIOLACAO_DE_UNICIDADE;
}

function montarContratoResposta(contrato: Contrato, momento: Date): ContratoResposta {
  const diasRestantes = calcularDiasRestantes(contrato.fidelidadeAte, momento);
  return {
    purchase_value: centavosParaMoeda(decimalParaCentavos(contrato.valorCompra)),
    loyalty_until: formatarDataDeBrasilia(contrato.fidelidadeAte),
    remaining_days: diasRestantes,
    penalty_rate: calcularPercentualDaMulta(diasRestantes),
  };
}

@Injectable()
export class ClubesService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(dto: CreateClubeDto): Promise<ClubeResposta> {
    const nomeNormalizado = dto.name.toLowerCase();

    try {
      const clube = await this.prisma.$transaction(async (transacao) => {
        if ((await transacao.clube.count()) >= LIMITE_DE_CLUBES) {
          throw new ConflictException(`A liga aceita no máximo ${LIMITE_DE_CLUBES} clubes.`);
        }
        if (await transacao.clube.findUnique({ where: { nomeNormalizado } })) {
          throw new ConflictException('Já existe um clube com esse nome.');
        }
        if (await transacao.clube.findUnique({ where: { sigla: dto.acronym } })) {
          throw new ConflictException('Já existe um clube com essa sigla.');
        }
        return transacao.clube.create({
          data: {
            nome: dto.name,
            nomeNormalizado,
            sigla: dto.acronym,
            caixa: centavosParaTexto(CAIXA_INICIAL_EM_CENTAVOS),
          },
        });
      });
      return montarClubeResposta(clube, 0);
    } catch (erro) {
      if (ehViolacaoDeUnicidade(erro)) {
        throw new ConflictException('Já existe um clube com esse nome ou sigla.');
      }
      throw erro;
    }
  }

  async listar(ordenacao: OrdenacaoDeClubes = 'name'): Promise<ClubeResposta[]> {
    const linhas = await listarClubesComValorDoElenco(this.prisma, ordenacao);
    const clubes = await this.prisma.clube.findMany({ where: { id: { in: linhas.map((linha) => linha.id) } } });
    const clubePorId = new Map(clubes.map((clube) => [clube.id, clube]));

    return linhas.flatMap((linha) => {
      const clube = clubePorId.get(linha.id);
      return clube ? [montarClubeResposta(clube, linha.valorDoElencoEmCentavos)] : [];
    });
  }

  async buscarPorId(id: number): Promise<ClubeDetalhadoResposta> {
    const clube = await this.prisma.clube.findUnique({ where: { id } });
    if (!clube) {
      throw new NotFoundException('Clube não encontrado.');
    }

    const idsDoElenco = await buscarIdsDaPagina(this.prisma, {
      clubeId: id,
      ordenacao: ['position'],
      pagina: 1,
      limite: LIMITE_DO_ELENCO,
    });
    const [jogadores, contratos] = await Promise.all([
      this.prisma.jogador.findMany({ where: { id: { in: idsDoElenco } } }),
      this.prisma.contrato.findMany({ where: { clubeId: id, situacao: 'ATIVO', jogadorId: { in: idsDoElenco } } }),
    ]);
    const jogadorPorId = new Map(jogadores.map((jogador) => [jogador.id, jogador]));
    const contratoPorJogador = new Map(contratos.map((contrato) => [contrato.jogadorId, contrato]));
    const agora = new Date();

    const elenco = idsDoElenco.flatMap((jogadorId): JogadorDoElencoResposta[] => {
      const jogador = jogadorPorId.get(jogadorId);
      if (!jogador) {
        return [];
      }
      const contrato = contratoPorJogador.get(jogadorId);
      return [{ ...montarJogadorResposta(jogador), contract: contrato ? montarContratoResposta(contrato, agora) : null }];
    });
    const valorDoElencoEmCentavos = elenco.reduce((soma, jogador) => soma + Math.round(jogador.market_value * 100), 0);

    return { ...montarClubeResposta(clube, valorDoElencoEmCentavos), players: elenco };
  }
}