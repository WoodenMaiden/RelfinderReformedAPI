import { PREFIX, SearchOptions, DEFAULT_SEARCH_OPTIONS } from './constants';
import { SparqlConfig } from '../config/configuration';
import { range } from '../util';

export function gen_from(graphs: string[]) {
  return graphs.map((g) => `FROM <${g}>`).join(' ');
}

export function searchForLabel(
  text: string,
  searchOptions: SearchOptions,
  sparqlConfig: SparqlConfig,
): string {
  const graphs = gen_from(sparqlConfig.graphs);
  searchOptions = { ...DEFAULT_SEARCH_OPTIONS, ...searchOptions };

  return (
    // I am using Tobermory.es6-string-html, that's why these kind of comments :)
    /*SQL*/
    `${PREFIX} SELECT ?s ?label ${graphs} WHERE {
      ?s rdfs:label ?label. FILTER (
        CONTAINS(LCASE(CONCAT(STR(?s), " ", STR(?label))), '${text}')
      ).
    } LIMIT ${searchOptions.limit}`
  );
}

export function getObjectsOf(subject_url: string, sparqlConfig: SparqlConfig) {
  const graphs = gen_from(sparqlConfig.graphs);

  return (
    /*SQL*/
    `${PREFIX} SELECT ?p ?o ${graphs} WHERE {
      <${subject_url}> ?p ?o.
    }`
  );
}

export function getGraphUpTo(
  start_entities: string[],
  maxDepth: number,
  sparqlConfig: SparqlConfig,
) {
  const graphs = gen_from(sparqlConfig.graphs);

  // ex: "{\n    ?s ?p ?intermediate.\n    ?intermediate ?_p ?_intermediate.\n?_intermediate ?__p ?o.\n  }"
  const generateIntermediates = (depth: number): string[] =>
    range(depth).map(
      (d) => `{
    ?s ?p ?intermediate.
    ${range(d + 1)
      .map(
        (_d) =>
          `?${'_'.repeat(_d)}intermediate ?${'_'.repeat(_d + 1)}p ?${
            _d === d ? 'o' : `${'_'.repeat(_d + 1)}intermediate`
          }`,
      )
      .join('.\n')}.
  }`,
    );

  return (
    /*SQL*/
    `${PREFIX} SELECT ?s ?p ${
      maxDepth <= 1
        ? ''
        : range(maxDepth)
            .map((d) => `?${'_'.repeat(d)}intermediate ?${'_'.repeat(d + 1)}p`)
            .join(' ') + ' '
    }?o  ${graphs} WHERE {
      VALUES ?s { <${start_entities.join('> <')}> }
      {
        ?s ?p ?o .
      }${
        maxDepth >= 1
          ? ` UNION ${generateIntermediates(maxDepth).join(' UNION ')}`
          : ''
      }

    }`
  );
}
