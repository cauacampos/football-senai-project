import { PartialType } from '@nestjs/mapped-types';
import { CreateJogadoresDto } from './create-jogadores.dto';

export class UpdateJogadoresDto extends PartialType(CreateJogadoresDto) {}
