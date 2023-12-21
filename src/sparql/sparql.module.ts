import { DynamicModule, Module } from '@nestjs/common';
import { SparqlService } from './sparql.service';
import { ENDPOINT_URL } from './constants';

@Module({
  providers: [SparqlService],
})
export class SparqlModule {
  static forRoot(url: string): DynamicModule {
    return {
      module: SparqlModule,
      providers: [
        {
          provide: ENDPOINT_URL,
          useValue: url,
        },
        SparqlService,
      ],
      exports: [SparqlService],
    };
  }
}
