import { Inject, Injectable, Logger } from '@nestjs/common';

import ParsingClient from 'sparql-http-client/ParsingClient';
import SimpleClient from 'sparql-http-client/SimpleClient';
import { ResultRow } from 'sparql-http-client/ResultParser';

import { GRAPH_CONFIG, PING } from './constants';
import { SparqlConfig } from 'src/config/configuration';
import { measureQueryTime } from 'src/util';
import { SparqlModule } from './sparql.module';
import {
  NeighborsResult,
  NodeLabel,
  Ping,
  SparqlRawSelect,
  SparqlRawSelectBinding,
  TripleResult,
} from './sparqlTypes';

import {
  searchForLabel,
  getObjectsOf as queryObjectsOf,
  getGraphUpTo,
} from './queries';
import { SearchOptions } from 'src/labels/StoringStrategies';

@Injectable()
export class SparqlService {
  private parsingClient: ParsingClient;
  private simpleClient: SimpleClient;

  constructor(
    @Inject(GRAPH_CONFIG) private readonly sparqlConfig: SparqlConfig,
  ) {
    this.parsingClient = new ParsingClient({
      endpointUrl: sparqlConfig.sparql_address,
    });

    this.simpleClient = new SimpleClient({
      endpointUrl: sparqlConfig.sparql_address,
    });
  }

  private async selectWithoutParsing(query: string): Promise<SparqlRawSelect> {
    const executedQuery = await measureQueryTime(
      (await this.simpleClient.query.select(query)).json(),
    );

    Logger.debug(
      `Executed SPARQL (unparsed): ${query} in ${executedQuery.time}ms`,
      SparqlModule.name,
    );
    Logger.verbose(executedQuery.result, SparqlModule.name);

    return executedQuery.result;
  }

  private async select<Q extends ResultRow>(query: string): Promise<Q[]> {
    const executedQuery = await measureQueryTime(
      this.parsingClient.query.select(query) as Promise<Q[]>,
    );

    Logger.debug(
      `Executed SPARQL (parsed): ${query} in ${executedQuery.time}ms`,
      SparqlModule.name,
    );
    Logger.verbose(executedQuery.result, SparqlModule.name);

    return executedQuery.result as Q[];
  }

  async ping() {
    return this.select<Ping>(PING);
  }

  async seachLabel(text: string, searchOptions: SearchOptions) {
    return this.select<NodeLabel>(
      searchForLabel(text, searchOptions, this.sparqlConfig),
    );
  }

  async getObjectsOf(subject_url: string) {
    return this.select<NeighborsResult>(
      queryObjectsOf(subject_url, this.sparqlConfig),
    );
  }

  // This retrieves a subgraph containing all the entities in start_entities up to a depth of maxDepth, then parses it into distinct triples
  async fetchGraphFrom(
    start_entities: string[],
    maxDepth: number,
  ): Promise<TripleResult[]> {
    const rawResult = await this.selectWithoutParsing(
      getGraphUpTo(start_entities, maxDepth, this.sparqlConfig),
    );

    const order = rawResult.head.vars;
    const triples = rawResult.results.bindings.flatMap<TripleResult>(
      (binding: SparqlRawSelectBinding) => {
        const map = new Map(Object.entries(binding));
        const variables = order.map<string | undefined>(
          (variable) => map.get(variable)?.value,
        );

        let i = 0;
        const fifo_queue: string[] = [];

        return variables.reduceRight((acc, value) => {
          ++i;

          if (value) {
            fifo_queue.push(value);
          }

          if (i % 3 == 0) {
            // We should have [object, predicate, subject]
            // the current subject will be the next object since we read from right to left

            acc.push({
              o: fifo_queue.shift(),
              p: fifo_queue.shift(),
              s: fifo_queue[0],
            });
            i = 0;
          }

          return acc;
        }, []);
      },
    ); // flatMap

    return [...new Set(triples)]; // to remove duplicates
  }
}
