import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CpuUsage, MemoryUsage } from './ressourceUsage';

@Injectable()
export class ApiStatsService {
  private cpuUsage: CpuUsage = {
    max: process.cpuUsage(),
    current: process.cpuUsage(),
  };
  private memoryUsage: MemoryUsage = {
    max: process.memoryUsage().heapUsed,
    current: process.memoryUsage().heapUsed,
  };

  @Cron('5 * * * * *') // every 5 seconds
  get_stats() {
    this.cpuUsage.current = process.cpuUsage(this.cpuUsage.current);
    this.memoryUsage.current = process.memoryUsage().heapUsed;

    if (
      this.cpuUsage.max.system < this.cpuUsage.current.system ||
      this.cpuUsage.max.user < this.cpuUsage.current.user
    )
      this.cpuUsage.max = this.cpuUsage.current;

    if (this.memoryUsage.max < this.memoryUsage.current)
      this.memoryUsage.max = this.memoryUsage.current;
  }

  public get cpu() {
    return this.cpuUsage;
  }

  public get memory() {
    return this.memoryUsage;
  }
}
