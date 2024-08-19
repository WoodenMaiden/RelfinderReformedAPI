import { NestApplication, NestFactory } from '@nestjs/core';
import { LogLevel, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { readFileSync } from 'graceful-fs';

import { version as appVersion } from 'package.json';

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
  app.useGlobalPipes(
    new ValidationPipe({
      disableErrorMessages: process.env.NODE_ENV === 'production',
      transform: false,
    }),
  );
  app.useLogger(app.get(ConfigService).get('logLevel') as LogLevel[]);

  SwaggerModule.setup(
    apiPrefix,
    app,
    SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('RelFinderReformed')
        .setDescription("RelFinderReformed's API")
        .setVersion(appVersion)
        .setContact(
          'Yann "WoodenMaiden" POMIE',
          'https://yann-pomie.fr',
          'yann.pomie@laposte.net',
        )
        .setLicense(
          'MIT',
          'https://github.com/WoodenMaiden/RelfinderReformedAPI/blob/master/LICENSE',
        )
        .build(),
    ),
  );

  await app.listen(port);

  Logger.log(`Listening on port ${port} 🚀`, NestApplication.name);
}
bootstrap();
