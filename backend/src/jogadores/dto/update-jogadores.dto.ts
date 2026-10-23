import { PickType } from '@nestjs/mapped-types';
import { CreateJogadoresDto } from './create-jogadores.dto';

export class UpdateJogadoresDto extends PickType(CreateJogadoresDto, ['name', 'position', 'agility', 'age'] as const) {}