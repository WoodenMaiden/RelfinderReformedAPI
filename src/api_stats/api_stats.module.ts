import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ApiStatsService } from './api_stats.service';
import { LabelsModule } from '../labels/labels.module';

@Module({
  imports: [ScheduleModule.forRoot(), LabelsModule],
  providers: [ApiStatsService],
  exports: [ApiStatsService],
})
export class ApiStatsModule {}
