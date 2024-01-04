// tokens for injection
export const GRAPH_CONFIG = 'GRAPH_CONFIG';

export type SearchOptions = {
  limit?: number;
};

export const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  limit: 10,
};

// SPARQL queries parts
export const PREFIX = `PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>`;
export const PING = 'select ("pong" as ?pong) {}';
