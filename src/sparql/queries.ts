import { PREFIX, SearchOptions, DEFAULT_SEARCH_OPTIONS } from './constants';
import { SparqlConfig } from 'src/config/configuration';

export function searchForLabel(
  text: string,
  searchOptions: SearchOptions,
  sparqlConfig: SparqlConfig,
): string {
  const graphs = sparqlConfig.graphs;
  searchOptions = { ...DEFAULT_SEARCH_OPTIONS, ...searchOptions };

  return (
    // I am using Tobermory.es6-string-html, that's why these kind of comments :)
    /*SQL*/
    `${PREFIX} SELECT ?s ?label ${graphs.map((g) => `FROM <${g}>`)} WHERE {
      ?s rdfs:label ?label. FILTER (
        CONTAINS(LCASE(CONCAT(STR(?s), " ", STR(?label))), '${text}')
      ).
    } LIMIT ${searchOptions.limit}`
  );
}
