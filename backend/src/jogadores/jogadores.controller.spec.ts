import { Test, TestingModule } from '@nestjs/testing';
import { JogadoresController } from './jogadores.controller';
import { JogadoresService } from './jogadores.service';

describe('JogadoresController', () => {
  let controller: JogadoresController;

  const jogadoresServiceMock = {
    cadastrar: jest.fn(),
    listar: jest.fn(),
    buscarPorId: jest.fn(),
    editar: jest.fn(),
    alterarCondicao: jest.fn(),
    excluir: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JogadoresController],
      providers: [
        {
          provide: JogadoresService,
          useValue: jogadoresServiceMock,
        },
      ],
    }).compile();

    controller = module.get<JogadoresController>(JogadoresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});