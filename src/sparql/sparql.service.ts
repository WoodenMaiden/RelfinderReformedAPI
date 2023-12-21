import { Inject, Injectable } from '@nestjs/common';

// import ParsingClient from 'sparql-http-client/ParsingClient';
import SimpleClient from 'sparql-http-client/SimpleClient';

import { ENDPOINT_URL, PING } from './constants';

@Injectable()
export class SparqlService {
  private simpleClient: SimpleClient;
  // private parsingClient: ParsingClient;

  constructor(@Inject(ENDPOINT_URL) url: string) {
    // this.parsingClient = new ParsingClient({ endpointUrl: url });
    this.simpleClient = new SimpleClient({ endpointUrl: url });
  }

  async ping() {
    this.simpleClient.query.select(PING);
  }
}
