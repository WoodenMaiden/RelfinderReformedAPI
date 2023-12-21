import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ApiStatsService } from './api_stats.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [ApiStatsService],
  exports: [ApiStatsService],
})
export class ApiStatsModule {}
