import { DynamicModule, Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';

import { LabelsController } from './labels.controller';
import { LabelsService } from './labels.service';
import {
  DEFAULT_SEQUELIZE_LABEL_STORE_ARGUMENTS,
  LABEL_STORE,
  Protocol,
} from './constants';
import StoringStrategy, {
  PostgresLabelModel,
  PostgresStrategy,
  MySQLStrategy,
  MySQLLabelModel,
  DefaultStragtegy,
} from './StoringStrategies';
import { SparqlModule, SparqlService } from 'src/sparql';

@Module({})
export class LabelsModule {
  static forRoot(): DynamicModule {
    const imports: DynamicModule[] = [SparqlModule.forRoot()];
    const strategy = this.getStrategy(process.env.LABEL_STORE_URL);

    if (
      strategy == Protocol.POSTGRES ||
      strategy == Protocol.MYSQL ||
      strategy == Protocol.MARIADB
    ) {
      imports.push(
        SequelizeModule.forRoot({
          ...DEFAULT_SEQUELIZE_LABEL_STORE_ARGUMENTS,
          dialect: strategy == Protocol.POSTGRES ? 'postgres' : strategy,
          uri: process.env.LABEL_STORE_URL,
        }),
      );
    }

    switch (strategy) {
      case Protocol.POSTGRES:
        imports.push(SequelizeModule.forFeature([PostgresLabelModel]));
        break;

      case Protocol.MARIADB:
      case Protocol.MYSQL:
        imports.push(SequelizeModule.forFeature([MySQLLabelModel]));
        break;

      case Protocol.HTTP:
      case Protocol.HTTPS:
        break;

      default:
        Logger.log(
          'Using default strategy for the labelstore',
          LabelsModule.name,
        );
    }

    return {
      module: LabelsModule,
      imports,
      providers: [
        {
          provide: LABEL_STORE,
          useFactory: (
            configService: ConfigService,
            sparqlService: SparqlService,
          ): StoringStrategy => {
            const uri = configService.get<string>('labelstore.address');

            switch (this.getStrategy(uri)) {
              case Protocol.POSTGRES:
                return new PostgresStrategy();

              case Protocol.MARIADB:
              case Protocol.MYSQL:
                return new MySQLStrategy();

              case Protocol.HTTP:
              case Protocol.HTTPS:

              default:
                return new DefaultStragtegy(sparqlService);
            }
          },
          inject: [ConfigService, SparqlService],
        },
        LabelsService,
      ],
      exports: [LabelsService],
      controllers: [LabelsController],
    };
  }

  private static getStrategy(uri: string) {
    return /^.[^\:\/]+/.exec(uri)[0] as Protocol;
  }
}
