import { Inject, Injectable, Logger } from '@nestjs/common';

import { Term } from 'rdf-js';
import ParsingClient from 'sparql-http-client/ParsingClient';
import SimpleClient from 'sparql-http-client/SimpleClient';
import { ResultRow } from 'sparql-http-client/ResultParser';

import { GRAPH_CONFIG, PING } from './constants';
import { SparqlConfig } from '../config/configuration';
import { measureQueryTime } from '../util';
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
import { SearchOptions } from '../labels/StoringStrategies';

@Injectable()
export class SparqlService {
  private parsingClient: ParsingClient;
  private simpleClient: SimpleClient;

  constructor(
    @Inject(GRAPH_CONFIG) private readonly sparqlConfig: SparqlConfig,
  ) {
    this.parsingClient = new ParsingClient({
      endpointUrl: sparqlConfig.sparqlAddress,
    });

    this.simpleClient = new SimpleClient({
      endpointUrl: sparqlConfig.sparqlAddress,
    });
  }

  async selectWithoutParsing(query: string): Promise<SparqlRawSelect> {
    const executedQuery = await measureQueryTime(
      (await this.simpleClient.query.select(query)).json(),
    );

    Logger.debug(
      `Executed SPARQL (unparsed): ${query} in ${executedQuery.time}ms`,
      SparqlModule.name,
    );
    Logger.verbose(
      `Unparsed SPARQL returned:\n${JSON.stringify(executedQuery.result)}`,
      SparqlModule.name,
    );

    return executedQuery.result;
  }

  async select<Q extends ResultRow>(query: string): Promise<Q[]> {
    const executedQuery = await measureQueryTime(
      this.parsingClient.query.select(query) as Promise<Q[]>,
    );

    Logger.debug(
      `Executed SPARQL (parsed): ${query} in ${executedQuery.time}ms`,
      SparqlModule.name,
    );
    Logger.verbose(
      `Parsed SPARQL returned\n${executedQuery.result}`,
      SparqlModule.name,
    );

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
    const triples = rawResult.results.bindings
      .flatMap<TripleResult>((binding: SparqlRawSelectBinding) => {
        const map = new Map(Object.entries(binding));
        const variables: Term[] = order
          .map<Term | undefined>((variable) => map.get(variable))
          .filter((value) => value); // remove undefined values

        let i = 0;
        const fifo_queue: Term[] = [];

        return variables.reduceRight((acc: TripleResult[], value: Term) => {
          ++i;

          fifo_queue.push(value);

          if (i % 3 == 0) {
            // We should have [object, predicate, subject]
            // the current subject will be the next object since we read from right to left

            Logger.verbose(`i=${i}; FIFO queue: `);
            Logger.verbose(
              fifo_queue.map((v) => v.value),
              SparqlModule.name,
            );

            const entry: TripleResult = {
              o: fifo_queue.shift(),
              p: fifo_queue.shift(),
              s: fifo_queue[0],
            } as TripleResult;

            acc.push(entry);

            i = 1;
          }

          return acc;
        }, [] as TripleResult[]); // reduceRight
      }) // flatMap
      .filter(
        // the results will contain duplicates, since it is under the form
        // a: b: c:
        // a: b: c: d: e: f:
        // a: b: c: d: e: f: g: h: i:
        // ...
        // so we remove them
        (triple, index, arr) =>
          arr.findLastIndex(
            ({ s, p, o }) =>
              s.termType === triple.s.termType &&
              s.value === triple.s.value &&
              p.termType === triple.p.termType &&
              p.value === triple.p.value &&
              o.termType === triple.o.termType &&
              o.value === triple.o.value,
          ) === index,
      ); // const triples

    Logger.debug(`Fetch graph w/ ${triples.length} edges`, SparqlService.name);

    return triples;
  }
}
