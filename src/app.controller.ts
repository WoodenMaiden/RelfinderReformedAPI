import { Controller, Get, Redirect } from '@nestjs/common';
import { AppService } from './app.service';
import { HealthResponse } from './HealthResponse';

@Controller('/')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Redirect('/ui', 301)
  status() {}

  @Get(['health', 'healthz'])
  async health(): Promise<HealthResponse> {
    return this.appService.health();
  }
}
