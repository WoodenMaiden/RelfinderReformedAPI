import { SearchOptions } from '../sparql';
import { PREFIX } from '../sparql/constants';
import { SparqlConfig } from '../config/configuration';

import {
  genFromClause,
  getObjectsOf,
  searchForLabel,
  getGraphUpTo,
} from '../sparql/queries';

describe('SPARQL query construction', () => {
  const sparqlConfig: SparqlConfig = {
    sparqlAddress: '',
    graphs: [],
    exclusions: {
      classes: [],
      namespaces: [],
    },
  };

  it('should generate a valid `FROM` statement', () => {
    const graphs = ['ns:1', 'ns:2', 'ns:3'];

    expect(genFromClause(graphs)).toBe('FROM <ns:1> FROM <ns:2> FROM <ns:3>');
    expect(genFromClause(graphs.slice(0, 1))).toBe('FROM <ns:1>');
    expect(genFromClause([])).toBe('');
  });

  it('should generate a SPARQL Query to get direct objects', () => {
    const entity = 'http://a';

    const generated_query = getObjectsOf(entity, sparqlConfig);

    expect(generated_query).toContain(PREFIX);
    expect(generated_query).toContain('SELECT ?p ?o ');
    expect(generated_query).toContain('WHERE');
    expect(generated_query).toContain(`<${entity}> ?p ?o.`);
  });

  it('should generate a SPARQL Query to get labels and corresponding entities', () => {
    const text = 'some text';
    const searchOptions: SearchOptions = {
      limit: 100,
    };

    const generated_query = searchForLabel(text, searchOptions, sparqlConfig);

    expect(generated_query).toContain(PREFIX);
    expect(generated_query).toContain('SELECT ?subject ?label ');
    expect(generated_query).toContain('WHERE');
    expect(generated_query).toContain(
      `CONTAINS(LCASE(CONCAT(STR(?s), " ", STR(?label))), '${text}')`,
    );
    expect(generated_query).toContain(`LIMIT ${searchOptions.limit}`);
  });

  describe('Generate a SPARQL Query to explore a graph up to a certain depth', () => {
    it('depth set at 0 should only show the starting entities', () => {
      const start_entities = ['ns:1', 'ns:2'];
      const maxDepth = 0;

      const generated_query = getGraphUpTo(
        start_entities,
        maxDepth,
        sparqlConfig,
      );

      expect(generated_query).toContain(PREFIX);
      expect(generated_query).toContain('SELECT DISTINCT ?s');

      expect(generated_query).not.toContain('SELECT DISTINCT ?s ?p ?o');
      expect(generated_query).not.toContain(
        'SELECT DISTINCT ?s ?p ?intermediate',
      );

      expect(generated_query).toContain('WHERE');
      expect(generated_query).toContain(
        `VALUES ?s { <${start_entities.join('> <')}> }`,
      );
      expect(generated_query).toContain('?s ?p ?o.');

      expect(generated_query).not.toContain('?s ?p ?intermediate.');
      expect(generated_query).not.toContain('UNION');
    });

    it('depth set at 1 should only show the direct neighbors of the starting entities', () => {
      const start_entities = ['ns:1', 'ns:2'];
      const maxDepth = 1;

      const generated_query = getGraphUpTo(
        start_entities,
        maxDepth,
        sparqlConfig,
      );

      expect(generated_query).toContain(PREFIX);
      expect(generated_query).toContain('SELECT DISTINCT ?s ?p ?o ');
      expect(generated_query).toContain('WHERE');
      expect(generated_query).toContain(
        `VALUES ?s { <${start_entities.join('> <')}> }`,
      );
      expect(generated_query).toContain('?s ?p ?o.');

      expect(generated_query).not.toContain('UNION');
      expect(generated_query).not.toContain('?s ?p ?intermediate.');
      expect(generated_query).not.toContain('?intermediate ?_p ?o.');
    });

    it('should generate a valid query for a max depth of 3', () => {
      const start_entities = ['ns:1', 'ns:2'];
      const maxDepth = 3;

      const generated_query = getGraphUpTo(
        start_entities,
        maxDepth,
        sparqlConfig,
      );

      expect(generated_query).toContain(
        'SELECT DISTINCT ?s ?p ?intermediate ?_p ?_intermediate ?__p ?o',
      );

      expect(generated_query).toContain('UNION');
      expect(generated_query).toContain('?s ?p ?intermediate.');
      expect(generated_query).toContain('?intermediate ?_p ?_intermediate.');
      expect(generated_query).toContain('?_intermediate ?__p ?o.');

      expect(generated_query).not.toContain(
        '?_intermediate ?__p ?__intermediate.',
      );
      expect(generated_query).not.toContain('?__intermediate ?___p ?o.');
    });
  });
});
