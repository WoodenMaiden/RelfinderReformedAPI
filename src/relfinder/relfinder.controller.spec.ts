import { Test, TestingModule } from '@nestjs/testing';
import { RelFinderController } from './relfinder.controller';

describe('RelFinderController', () => {
  let controller: RelFinderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RelFinderController],
    }).compile();

    controller = module.get<RelFinderController>(RelFinderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
