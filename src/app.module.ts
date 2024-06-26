import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SparqlModule } from './sparql';
import { ApiStatsModule } from './api_stats';
import { LabelsModule } from './labels/labels.module';
import { RelFinderService, RelFinderController } from './relfinder';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        API_PREFIX: Joi.string().default('api'),
        SPARQL_ADDRESS: Joi.string().required().uri(),
        LABEL_STORE_URL: Joi.string().uri().optional().allow(''),
        LABEL_STORE_TOKEN: Joi.string().optional().allow(''),
        PORT: Joi.number().default(3000),
        EXCLUDED_CLASSES: Joi.string().optional().allow(''),
        EXCLUDED_NAMESPACES: Joi.string().optional().allow(''),
        GRAPHS: Joi.string().optional().allow(''),
        LOG_LEVEL: Joi.string()
          .valid('log', 'error', 'warn', 'debug', 'verbose')
          .insensitive()
          .default('log'),
      }),
    }),
    ApiStatsModule,
    SparqlModule.forRoot(),
    LabelsModule.forRoot(),
  ],
  controllers: [AppController, RelFinderController],
  providers: [AppService, RelFinderService],
})
export class AppModule {}
