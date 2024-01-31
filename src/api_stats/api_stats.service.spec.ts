jest.useFakeTimers();

import { Test, TestingModule } from '@nestjs/testing';
import { ApiStatsService } from './api_stats.service';
import { LabelsService } from '../labels/labels.service';

describe('RelFinderService', () => {
  let service: ApiStatsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        {
          module: class FakeApiStatsModule {},
          providers: [
            {
              provide: LabelsService,
              useValue: {},
            },
          ],
          exports: [LabelsService],
        },
      ],
      providers: [ApiStatsService],
    }).compile();

    service = module.get<ApiStatsService>(ApiStatsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get stats with cronjob', async () => {
    jest.advanceTimersByTime(6000);

    const cpu = service.cpu;
    const memory = service.memory;

    expect(cpu).toBeDefined();
    expect(memory).toBeDefined();

    jest.advanceTimersByTime(6000);

    expect(service.cpu.max.system).toBeGreaterThanOrEqual(cpu.max.system);
    expect(service.cpu.max.user).toBeGreaterThanOrEqual(cpu.max.user);

    expect(service.memory.max).toBeGreaterThanOrEqual(memory.max);
  });
});
