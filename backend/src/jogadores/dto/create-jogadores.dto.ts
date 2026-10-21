import { MaxLength, IsString, IsInt, Max, IsPositive, Min, IsNumber, IsOptional } from "class-validator";

export class CreateJogadoresDto {
  @IsString()
  @MaxLength(100)
  nome: string;

  @IsString()
  @MaxLength(3)
  posicao: string;

  @IsInt()
  @Min(0)
  agilidade: number;

  @IsInt()
  @Min(0)
  idade: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valorBase: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  condicao?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  clubeId?: number;

  @IsInt()
  @Min(0)
  velocidade: number;

  @IsInt()
  @Min(0)
  finalizacao: number;

  @IsInt()
  @Min(0)
  passe: number;

  @IsInt()
  @Min(0)
  drible: number;

  @IsInt()
  @Min(0)
  defesa: number;

  @IsInt()
  @Min(0)
  fisico: number;

  @IsInt()
  @Min(0)
  potencial: number;
}
