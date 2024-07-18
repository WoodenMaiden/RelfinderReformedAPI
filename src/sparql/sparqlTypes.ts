import { Literal, NamedNode } from 'rdf-js';
import { ResultRow } from 'sparql-http-client/ResultParser';

export type GraphResults = ResultRow & {
  graph: NamedNode;
};

export type NodeLabel = ResultRow & {
  subject: NamedNode;
  label: NamedNode;
};

export type TripleResult = ResultRow & {
  s: NamedNode;
  p: NamedNode;
  o: NamedNode | Literal;
};

export type NeighborsResult = ResultRow & {
  p: NamedNode;
  o: NamedNode | Literal;
};

export type Ping = ResultRow & {
  pong: Literal;
};

export type SparqlRawSelectHead = {
  vars: string[];
  link?: string[];
};

export type SparqlRawSelectBinding = {
  [key: string]: Literal | NamedNode;
};

export type SparqlRawSelect = {
  head: SparqlRawSelectHead;
  results: {
    bindings: SparqlRawSelectBinding[];
    distinct?: boolean;
    ordered?: boolean;
  };
};
