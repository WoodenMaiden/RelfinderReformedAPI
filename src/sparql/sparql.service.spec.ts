import { Test, TestingModule } from '@nestjs/testing';
import { SparqlRawSelect, SparqlService, SearchOptions } from '../sparql';
import { GRAPH_CONFIG, PREFIX } from '../sparql/constants';
import {
  gen_from,
  getObjectsOf,
  searchForLabel,
  getGraphUpTo,
} from '../sparql/queries';
import { SparqlConfig } from '../config/configuration';

describe('SparqlService', () => {
  let service: SparqlService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SparqlService,
        {
          provide: GRAPH_CONFIG,
          useValue: {
            exclusions: {
              classes: [],
              namespaces: [],
            },
            graphs: [],
            sparql_address: 'http://localhost:8080/sparql',
          } as SparqlConfig,
        },
      ],
    }).compile();

    service = module.get<SparqlService>(SparqlService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fetch the graph w/ `fetchGraphFrom`', async () => {
    const spy = jest.spyOn(service, 'selectWithoutParsing').mockResolvedValue({
      head: {
        vars: ['s', 'p', 'i', '_p', '_i', '__p', 'o'],
      },
      results: {
        bindings: [
          {
            s: { value: 'ns:1' },
            p: { value: 'rdfs:type' },
            i: { value: 'ns:2' },
            _p: { value: 'rdfs:label' },
            _i: { value: 'label' },
            __p: { value: 'rdfs:type' },
            o: { value: 'owl:Class' },
          },
          {
            s: { value: 'ns:3' },
            p: { value: 'rdfs:class' },
            i: { value: 'ns:4' },
            wait_this_shouldnt_be_here: { value: 'ns:7' },
            _p: { value: 'rdfs:similarto' },
            o: { value: 'ns:5' },
          },
          {
            s: { value: 'ns:6' },
            p: { value: 'rdfs:label' },
            o: { value: 'label' },
            i_hope_this_does_not_appear_in_results: { value: 'ns:8' },
          },
        ],
      },
    } as unknown as SparqlRawSelect);

    const triples = await service.fetchGraphFrom([], 0);

    expect(spy).toHaveBeenCalled();
    expect(triples).toHaveLength(6);

    expect(triples).toContainEqual({
      s: { value: 'ns:1' },
      p: { value: 'rdfs:type' },
      o: { value: 'ns:2' },
    });

    expect(triples).toContainEqual({
      s: { value: 'ns:2' },
      p: { value: 'rdfs:label' },
      o: { value: 'label' },
    });

    expect(triples).toContainEqual({
      s: { value: 'label' },
      p: { value: 'rdfs:type' },
      o: { value: 'owl:Class' },
    });

    expect(triples).toContainEqual({
      s: { value: 'ns:3' },
      p: { value: 'rdfs:class' },
      o: { value: 'ns:4' },
    });

    expect(triples).toContainEqual({
      s: { value: 'ns:4' },
      p: { value: 'rdfs:similarto' },
      o: { value: 'ns:5' },
    });

    expect(triples).toContainEqual({
      s: { value: 'ns:6' },
      p: { value: 'rdfs:label' },
      o: { value: 'label' },
    });
  });
});

describe('SPARQL construction', () => {
  const sparqlConfig: SparqlConfig = {
    sparql_address: '',
    graphs: [],
    exclusions: {
      classes: [],
      namespaces: [],
    },
  };

  it('should generate a valid `FROM` statement', () => {
    const graphs = ['ns:1', 'ns:2', 'ns:3'];

    expect(gen_from(graphs)).toBe('FROM <ns:1> FROM <ns:2> FROM <ns:3>');
    expect(gen_from(graphs.slice(0, 1))).toBe('FROM <ns:1>');
    expect(gen_from([])).toBe('');
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
    expect(generated_query).toContain('SELECT ?s ?label ');
    expect(generated_query).toContain('WHERE');
    expect(generated_query).toContain(
      `CONTAINS(LCASE(CONCAT(STR(?s), " ", STR(?label))), '${text}')`,
    );
    expect(generated_query).toContain(`LIMIT ${searchOptions.limit}`);
  });

  describe('Generate a SPARQL Query to explore a graph up to a certain depth', () => {
    it('should generate a valid query for a max depth of 0', () => {
      const start_entities = ['ns:1', 'ns:2'];
      const maxDepth = 0;

      const generated_query = getGraphUpTo(
        start_entities,
        maxDepth,
        sparqlConfig,
      );

      expect(generated_query).toContain(PREFIX);
      expect(generated_query).toContain('SELECT ?s ?p ?o ');
      expect(generated_query).toContain('WHERE');
      expect(generated_query).toContain(
        `VALUES ?s { <${start_entities.join('> <')}> }`,
      );
      expect(generated_query).toContain('?s ?p ?o .');

      expect(generated_query).not.toContain('?s ?p ?intermediate');
      expect(generated_query).not.toContain('UNION');
    });

    it('should generate a valid query for a max depth of 1', () => {
      const start_entities = ['ns:1', 'ns:2'];
      const maxDepth = 1;

      const generated_query = getGraphUpTo(
        start_entities,
        maxDepth,
        sparqlConfig,
      );

      expect(generated_query).toContain(PREFIX);
      expect(generated_query).toContain('SELECT ?s ?p ?o ');
      expect(generated_query).toContain('WHERE');
      expect(generated_query).toContain(
        `VALUES ?s { <${start_entities.join('> <')}> }`,
      );
      expect(generated_query).toContain('?s ?p ?o .');

      expect(generated_query).toContain('UNION');
      expect(generated_query).toContain('?s ?p ?intermediate');
      expect(generated_query).toContain('?intermediate ?_p ?o');
    });

    it('should generate a valid query for a max depth of 3', () => {
      const start_entities = ['ns:1', 'ns:2'];
      const maxDepth = 3;

      const generated_query = getGraphUpTo(
        start_entities,
        maxDepth,
        sparqlConfig,
      );

      expect(generated_query).toContain('UNION');
      expect(generated_query).toContain('?s ?p ?intermediate');
      expect(generated_query).toContain('?intermediate ?_p ?_intermediate');
      expect(generated_query).toContain('?_intermediate ?__p ?__intermediate');
      expect(generated_query).toContain('?__intermediate ?___p ?o');
    });
  });
});
