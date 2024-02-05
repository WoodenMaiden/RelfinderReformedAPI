import { NestApplication, NestFactory } from '@nestjs/core';
import { LogLevel, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = app.get(ConfigService).get('port');
  app.useLogger(app.get(ConfigService).get('logLevel') as LogLevel[]);
  await app.listen(port);

  Logger.log(`Listening on port ${port}`, NestApplication.name);
}
bootstrap();
