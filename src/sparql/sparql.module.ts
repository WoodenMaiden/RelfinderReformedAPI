import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { SparqlService } from './sparql.service';
import { GRAPH_CONFIG } from './constants';
import { SparqlConfig, Exclusions } from '../config/configuration';

@Module({
  providers: [SparqlService],
})
export class SparqlModule {
  static forRoot(): DynamicModule {
    return {
      module: SparqlModule,
      providers: [
        {
          provide: GRAPH_CONFIG,
          inject: [ConfigService],
          useFactory: (configService: ConfigService): SparqlConfig => ({
            exclusions: configService.get<Exclusions>('exclusions'),
            graphs: configService.get<string[]>('graphs'),
            sparqlAddress: configService.get<string>('sparqlAddress'),
          }),
        },
        SparqlService,
      ],
      exports: [SparqlService],
    };
  }
}
