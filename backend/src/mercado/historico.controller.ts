import { Controller, Get, Header, Query } from '@nestjs/common';
import { IdDaUrl } from '../comum/id-da-url.decorator';
import { HistoricoQueryDto } from './dto/historico-query.dto';
import { HistoricoResposta, HistoricoService } from './historico.service';

@Controller('clubs')
export class HistoricoController {
  constructor(private readonly historicoService: HistoricoService) {}

  @Get(':id/transactions')
  consultar(@IdDaUrl() id: number, @Query() consulta: HistoricoQueryDto): Promise<HistoricoResposta> {
    return this.historicoService.consultar(id, consulta);
  }

  @Get(':id/transactions/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="transacoes.csv"')
  exportar(@IdDaUrl() id: number, @Query() consulta: HistoricoQueryDto): Promise<string> {
    return this.historicoService.exportar(id, consulta);
  }
}