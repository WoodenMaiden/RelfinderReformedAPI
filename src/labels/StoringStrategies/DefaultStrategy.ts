import { NodeLabel, SparqlService, SearchOptions } from '../../sparql';

import StoringStrategy from './StoringStrategy';
import { measureQueryTime } from 'src/util';

// When no LabelStore has been provided, we will directly query the SPARQL endpoint
// This is slower and put extra stress on your tripplestore
export class DefaultStragtegy implements StoringStrategy {
  constructor(private readonly sparqlService: SparqlService) {}

  getName(): string {
    return 'SPARQL';
  }

  search(text: string, searchOptions?: SearchOptions): Promise<NodeLabel[]> {
    return this.sparqlService.seachLabel(text, searchOptions);
  }

  async ping(): Promise<number> {
    return (await measureQueryTime(this.sparqlService.ping())).time;
  }

  connect(): Promise<void> {
    return;
  }

  closeConnection(): Promise<void> {
    return;
  }
}
