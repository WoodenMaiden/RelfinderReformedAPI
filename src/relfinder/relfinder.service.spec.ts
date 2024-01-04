import { Test, TestingModule } from '@nestjs/testing';
import { RelFinderService } from './relfinder.service';

describe('RelFinderService', () => {
  let service: RelFinderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RelFinderService],
    }).compile();

    service = module.get<RelFinderService>(RelFinderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
