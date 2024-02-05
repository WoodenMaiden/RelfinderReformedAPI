import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { AppService } from './app.service';
import { ApiStatsService, CpuUsage, MemoryUsage } from './api_stats';
import { SparqlService, Ping } from './sparql';
import { LabelsService } from './labels/labels.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        {
          module: class FakeSparqlModule {},
          providers: [
            {
              provide: SparqlService,
              useValue: {
                ping: jest
                  .fn()
                  .mockResolvedValue({ pong: { value: 'pong' } } as Ping),
              },
            },
          ],
          exports: [SparqlService],
        },
        {
          module: class FakeConfigModule {},
          providers: [
            {
              provide: ConfigService,
              useValue: {
                get: jest.fn((key: string) =>
                  key === 'sparqlAddress' ? 'http://someurl' : null,
                ),
              },
            },
          ],
          exports: [ConfigService],
        },
        {
          module: class FakeApiStatsModule {},
          providers: [
            {
              provide: ApiStatsService,
              useValue: {
                cpu: jest.fn().mockReturnValue({
                  max: { system: 0, user: 0 },
                  current: { system: 0, user: 0 },
                } as CpuUsage),
                memory: jest
                  .fn()
                  .mockReturnValue({ max: 0, current: 0 } as MemoryUsage),
              },
            },
          ],
          exports: [ApiStatsService],
        },
        {
          module: class FakeLabelsModule {},
          providers: [
            {
              provide: LabelsService,
              useValue: {
                ping: jest.fn().mockResolvedValue(100),
              },
            },
          ],
          exports: [LabelsService],
        },
      ],
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return a valid health response', async () => {
    const health = await service.health();

    expect(health).toBeDefined();
    expect(health.message).toEqual('OK!');

    expect(health.endpoint.time).toBeGreaterThanOrEqual(0);
    expect(health.endpoint.url).toEqual('http://someurl');

    expect(health.labelStore.time).toEqual(100);

    expect(health.uptime).toMatch(/\d+h \d{1,2}m \d{1,2}s \d{1,3}ms/i);
  });
});
