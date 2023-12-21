import { Controller, Get, HttpCode } from '@nestjs/common';
import { AppService } from './app.service';
import { HealthResponse } from './HealthResponse';

@Controller('/')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @HttpCode(204)
  status() {
    return;
  }

  @Get(['health', 'healthz'])
  async health(): Promise<HealthResponse> {
    return this.appService.health();
  }
}
