import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { JogadoresService } from './jogadores.service';
import { CreateJogadoresDto } from './dto/create-jogadores.dto';
import { UpdateJogadoresDto } from './dto/update-jogadores.dto';

@Controller('jogadores')
export class JogadoresController {
  constructor(private readonly jogadoresService: JogadoresService) {}

  @Post()
  create(@Body() createJogadoresDto: CreateJogadoresDto) {
    return this.jogadoresService.createJogador(createJogadoresDto);
  }

  @Get()
  findAll() {
    return this.jogadoresService.getJogadores();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.jogadoresService.getJogadorById(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateJogadoresDto: UpdateJogadoresDto) {
    return this.jogadoresService.patchJogador(id, updateJogadoresDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.jogadoresService.deleteJogador(id);
  }
}
