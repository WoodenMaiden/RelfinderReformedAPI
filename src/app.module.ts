import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SparqlModule } from './sparql';
import { ApiStatsModule } from './api_stats';
import { LabelsModule } from './labels/labels.module';
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
        SPARQL_ADDRESS: Joi.string().required().uri(),
        LABEL_STORE_URL: Joi.string().uri().optional(),
        LABEL_STORE_TOKEN: Joi.string().optional(),
        PORT: Joi.number().default(3000),
        EXCLUDED_CLASSES: Joi.string().optional(),
        EXCLUDED_NAMESPACES: Joi.string().optional(),
        GRAPHS: Joi.string().optional(),
      }),
    }),
    ApiStatsModule,
    SparqlModule.forRoot(),
    LabelsModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
