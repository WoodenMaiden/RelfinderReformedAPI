import { NestApplication, NestFactory } from '@nestjs/core';
import { LogLevel, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'graceful-fs';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    httpsOptions:
      process.env.HTTPS_KEY_FILE && process.env.HTTPS_CERT_FILE
        ? {
            key: readFileSync(process.env.HTTPS_KEY_FILE),
            cert: readFileSync(process.env.HTTPS_CERT_FILE),
          }
        : null,
  });

  const port = app.get(ConfigService).get('port');
  const apiPrefix = app.get(ConfigService).get('apiPrefix');

  app.setGlobalPrefix(apiPrefix);
  app.useLogger(app.get(ConfigService).get('logLevel') as LogLevel[]);

  await app.listen(port);

  Logger.log(`Listening on port ${port} 🚀`, NestApplication.name);
}
bootstrap();
