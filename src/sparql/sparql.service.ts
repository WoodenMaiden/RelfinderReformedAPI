import { Inject, Injectable, Logger } from '@nestjs/common';

import ParsingClient from 'sparql-http-client/ParsingClient';
import { ResultRow } from 'sparql-http-client/ResultParser';

import { GRAPH_CONFIG, PING } from './constants';
import { SparqlConfig } from 'src/config/configuration';
import { measureQueryTime } from 'src/util';
import { SparqlModule } from './sparql.module';
import { Ping } from './sparqlTypes';

@Injectable()
export class SparqlService {
  private parsingClient: ParsingClient;

  constructor(@Inject(GRAPH_CONFIG) sparqlConfig: SparqlConfig) {
    this.parsingClient = new ParsingClient({
      endpointUrl: sparqlConfig.sparql_address,
    });
  }

  private async select<Q extends ResultRow>(query: string): Promise<Q[]> {
    const executedQuery = await measureQueryTime(
      this.parsingClient.query.select(query) as Promise<Q[]>,
    );

    Logger.debug(
      `Executed (default): ${query} in ${executedQuery.time}ms`,
      SparqlModule.name,
    );
    Logger.verbose(executedQuery.result, SparqlModule.name);

    return executedQuery.result as Q[];
  }

  async ping() {
    return this.select<Ping>(PING);
  }
}
