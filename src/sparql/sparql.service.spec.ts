import { Test, TestingModule } from '@nestjs/testing';
import { SparqlRawSelect, SparqlService } from '../sparql';
import { GRAPH_CONFIG } from '../sparql/constants';

import { SparqlConfig } from '../config/configuration';

import yann_irelia_response from '../../test/sparql_result.json';

function deepEqual(obj1, obj2) {
  if (obj1 === obj2) return true;

  if (
    typeof obj1 !== 'object' ||
    typeof obj2 !== 'object' ||
    obj1 === null ||
    obj2 === null
  ) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
}

function hasDuplicates(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (deepEqual(arr[i], arr[j])) {
        return true;
      }
    }
  }
  return false;
}

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
            sparqlAddress: 'http://localhost:8080/sparql',
          } as SparqlConfig,
        },
      ],
    }).compile();

    service = module.get<SparqlService>(SparqlService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fetch & build the graph w/ `fetchGraphFrom`', async () => {
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

    const triples = await service.fetchGraphFrom([], 0); // whatever

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

  it('should parse the graph without adding several times the same triples', async () => {
    const spy = jest
      .spyOn(service, 'selectWithoutParsing')
      .mockResolvedValue(yann_irelia_response as unknown as SparqlRawSelect);

    const triples = await service.fetchGraphFrom([], 0); // whatever

    expect(spy).toHaveBeenCalled();
    expect(triples).toBeDefined();

    // results from http://localhost:8888/sparql?default-graph-uri=&query=PREFIX+rdf%3A%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E+PREFIX+rdfs%3A%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E+SELECT+%3Fs+%3Fp+%3Fintermediate+%3F_p+%3Fo+++WHERE+%7B%0D%0A++++++VALUES+%3Fs+%7B+%3Chttp%3A%2F%2Fpeople.local%2Fyann%3E+%3Chttp%3A%2F%2Fgames.local%2Fleagueoflegends%2Fchampions%2Firelia%3E+%7D%0D%0A++++++%7B%0D%0A++++++++%3Fs+%3Fp+%3Fo+.%0D%0A++++++%7D+UNION+%7B%0D%0A++++%3Fs+%3Fp+%3Fintermediate.%0D%0A++++%3Fintermediate+%3F_p+%3Fo.%0D%0A++%7D%0D%0A%0D%0A++++%7D%0D%0A&format=text%2Fhtml&timeout=0&signal_void=on
    // total of triples is 57
    // duplicates in the sample response are
    // http://people.local/yann http://people.local#hasfriend http://people.local/someUser -> 7 additional times
    // http://people.local/yann http://people.local#mains	http://games.local/leagueoflegends/champions/ryze -> 7 additional times
    // http://people.local/yann	http://people.local#mains	http://games.local/leagueoflegends/champions/yorick -> 7 additional times
    // http://games.local/leagueoflegends/champions/irelia http://www.w3.org/1999/02/22-rdf-syntax-ns#type http://games.local/leagueoflegends/types/champions -> 1 additional time
    // http://people.local/yann http://people.local#plays http://games.local/leagueoflegends -> 1 additional time
    // http://people.local/yann http://www.w3.org/1999/02/22-rdf-syntax-ns#type	http://people.local/types/player -> 1 additional time

    expect(triples).toHaveLength(33);

    expect(triples).toContainEqual({
      s: {
        value: 'http://people.local/yann',
        type: 'uri',
      },
      p: {
        value: 'http://people.local#hasfriend',
        type: 'uri',
      },
      o: {
        value: 'http://people.local/someUser',
        type: 'uri',
      },
    });

    expect(triples).toContainEqual({
      s: {
        value: 'http://people.local/yann',
        type: 'uri',
      },
      p: {
        value: 'http://people.local#mains',
        type: 'uri',
      },
      o: {
        value: 'http://games.local/leagueoflegends/champions/ryze',
        type: 'uri',
      },
    });

    expect(triples).toContainEqual({
      s: {
        value: 'http://people.local/yann',
        type: 'uri',
      },
      p: {
        value: 'http://people.local#mains',
        type: 'uri',
      },
      o: {
        value: 'http://games.local/leagueoflegends/champions/yorick',
        type: 'uri',
      },
    });

    expect(triples).toContainEqual({
      s: {
        value: 'http://games.local/leagueoflegends/champions/irelia',
        type: 'uri',
      },
      p: {
        value: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
        type: 'uri',
      },
      o: {
        value: 'http://games.local/leagueoflegends/types/champions',
        type: 'uri',
      },
    });

    expect(triples).toContainEqual({
      s: {
        value: 'http://people.local/yann',
        type: 'uri',
      },
      p: {
        value: 'http://people.local#plays',
        type: 'uri',
      },
      o: {
        value: 'http://games.local/leagueoflegends',
        type: 'uri',
      },
    });

    expect(hasDuplicates(triples)).toBe(false);
  });
});
