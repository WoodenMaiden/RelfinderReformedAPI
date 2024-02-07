import { Injectable } from '@nestjs/common';
import { SparqlService } from './sparql';

import { measureQueryTime } from './util';
import { HealthResponse } from './HealthResponse';
import { ApiStatsService } from './api_stats';
import { ConfigService } from '@nestjs/config';
import { LabelsService } from './labels/labels.service';
import { version } from '../package.json';

@Injectable()
export class AppService {
  constructor(
    private readonly sparqlService: SparqlService,
    private readonly apiStatsService: ApiStatsService,
    private readonly configService: ConfigService,
    private readonly labelsService: LabelsService,
  ) {}

  async health(): Promise<HealthResponse> {
    const UPTIME: number = process.uptime();
    const cpu = this.apiStatsService.cpu;
    const memory = this.apiStatsService.memory;

    return {
      message: 'OK!',
      APIVersion: version,
      endpoint: {
        url: this.configService.get<string>('sparqlAddress'),
        time: (await measureQueryTime(this.sparqlService.ping())).time,
      },
      labelStore: { time: await this.labelsService.ping() },
      ressources: {
        cpu,
        memory,
      },
      uptime: `${Math.floor(UPTIME / 60 / 60)}h ${Math.floor(
        (UPTIME / 60) % 60,
      )}m ${Math.floor(UPTIME % 60)}s ${Math.floor((UPTIME % 1) * 1000)}ms`,
      calculatedStart: Date.now() - UPTIME * 1000,
    };
  }
}
