import { Literal, NamedNode } from 'rdf-js';
import { ResultRow } from 'sparql-http-client/ResultParser';

export type GraphResults = ResultRow & {
  graph: NamedNode;
};

export type NodeLabel = ResultRow & {
  s: NamedNode;
  label: NamedNode;
};

export type TripleResult = ResultRow & {
  s: NamedNode;
  p: NamedNode;
  o: NamedNode | Literal;
};

export type Ping = ResultRow & {
  pong: {
    value: Literal;
  };
};
