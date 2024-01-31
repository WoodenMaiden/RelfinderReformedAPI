import { Test, TestingModule } from '@nestjs/testing';
import { MultiDirectedGraph } from 'graphology';

import dataSet from '../../test/test_dataset.json';

import { GRAPH_CONFIG } from '../sparql';
import { SparqlConfig } from '../config/configuration';
import { RelFinderService } from './relfinder.service';
import { SparqlService, TripleResult } from '../sparql';

// const moduleMocker = new ModuleMocker(global);

describe('RelFinderService', () => {
  let service: RelFinderService;

  const graph: MultiDirectedGraph = new MultiDirectedGraph();
  'abcdefgh'.split('').forEach((letter) => graph.addNode(letter));

  graph.addDirectedEdgeWithKey('a-c', 'a', 'c', { value: 'a-c' });
  graph.addDirectedEdgeWithKey('c-e', 'c', 'e', { value: 'c-e' });
  graph.addDirectedEdgeWithKey('e-g', 'e', 'g', { value: 'e-g' });
  graph.addDirectedEdgeWithKey('g-e', 'g', 'e', { value: 'g-e' });
  graph.addDirectedEdgeWithKey('b-a', 'b', 'a', { value: 'b-a' });
  graph.addDirectedEdgeWithKey('c-b', 'c', 'b', { value: 'c-b' });
  graph.addDirectedEdgeWithKey('c-d', 'c', 'd', { value: 'c-d' });
  graph.addDirectedEdgeWithKey('e-f', 'e', 'f', { value: 'e-f' });
  graph.addDirectedEdgeWithKey('g-h', 'g', 'h', { value: 'g-h' });
  graph.addDirectedEdgeWithKey('h-g', 'h', 'g', { value: 'h-g' });
  graph.addDirectedEdgeWithKey('b-d', 'b', 'd', { value: 'b-d' });
  graph.addDirectedEdgeWithKey('d-f', 'd', 'f', { value: 'd-f' });
  graph.addDirectedEdgeWithKey('f-d', 'f', 'd', { value: 'f-d' });
  graph.addDirectedEdgeWithKey('h-f', 'h', 'f', { value: 'h-f' });

  const expected_components = [
    ['a', 'b', 'c'],
    ['d', 'f'],
    ['e', 'g', 'h'],
  ]
    .map((l) => l.sort())
    .sort();

  beforeEach(async () => {
    graph.nodes().forEach((node) => {
      graph.replaceNodeAttributes(node, {});
    });

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        {
          module: class FakeSparqlModule {},
          providers: [
            {
              provide: SparqlService,
              useValue: {
                fetchGraphFrom: jest
                  .fn()
                  .mockResolvedValue(dataSet.slice(0, 10) as TripleResult[]), // $ jq '.[:10]' test/test_dataset.json
              },
            },
          ],
          exports: [SparqlService],
        },
      ],
      providers: [RelFinderService],
    })
      .overrideProvider(GRAPH_CONFIG)
      .useValue({
        exclusions: {
          classes: [],
          namespaces: [],
        },
        graphs: [],
        sparql_address: '',
      } as SparqlConfig)
      .compile();

    service = module.get<RelFinderService>(RelFinderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return a valid graphologyjs graph with `buildGraphFromNodes()`', async () => {
    const graph = await service.buildGraphFromNodes(
      ['http://people.local/yann', 'http://people.local/someUser'],
      5,
    );

    expect(graph).toBeDefined();
    expect(graph.nodes()).toHaveLength(6);

    expect(graph.nodes()).toContainEqual('http://people.local/yann');
    expect(graph.nodes()).toContainEqual('http://people.local/someUser');
    expect(graph.nodes()).toContainEqual('http://people.local/types/player');

    expect(graph.nodes()).toContainEqual('Yann');
    expect(graph.nodes()).toContainEqual('WoodenMaiden');
    expect(graph.nodes()).toContainEqual('user');

    expect(graph.edges()).toHaveLength(10);

    const predicates = graph
      .edges()
      .map((edge) => graph.getEdgeAttribute(edge, 'value'));

    expect(predicates).toContainEqual('ppl:hasfriend');
    expect(predicates).toContainEqual('ppl:username');
    expect(predicates).toContainEqual('ppl:name');

    expect(predicates).toContainEqual('rdfs:label');
    expect(predicates).toContainEqual('rdf:type');

    expect([...new Set(predicates)]).toHaveLength(5);
  });

  it('should return valid strongly connected components', () => {
    //took this graph https://youtu.be/Jb1XlDsr46o for dfs

    const components = service
      .tarjansAlgorithm(graph)
      .map((l) => l.sort())
      .sort();

    expect(components).toHaveLength(3);
    expect(expected_components).toStrictEqual(components);
  });

  it('should be compressing a single strongly connected component', () => {
    const compressed = service.compressComponent(graph, expected_components[0]);

    expect(compressed.nodes).toHaveLength(3);
    expect(compressed.nodes.sort()).toStrictEqual(['a', 'b', 'c']);

    expect(compressed.edges).toHaveLength(6);

    expect(compressed.edges).toContainEqual({
      id: 'b-a',
      source: 'b',
      target: 'a',
      value: 'b-a',
    });

    expect(compressed.edges).toContainEqual({
      id: 'c-b',
      source: 'c',
      target: 'b',
      value: 'c-b',
    });

    expect(compressed.edges).toContainEqual({
      id: 'a-c',
      source: 'a',
      target: 'c',
      value: 'a-c',
    });

    expect(compressed.edges).toContainEqual({
      id: 'c-d',
      source: 'c',
      target: 'd',
      value: 'c-d',
    });

    expect(compressed.edges).toContainEqual({
      id: 'b-d',
      source: 'b',
      target: 'd',
      value: 'b-d',
    });

    expect(compressed.edges).toContainEqual({
      id: 'c-e',
      source: 'c',
      target: 'e',
      value: 'c-e',
    });
  });

  it('should decompress a single component', () => {
    const [compressed, rosettaStone] = service.compressGraph(
      graph,
      expected_components,
    );

    const decompressed = service.decompressComponent(
      compressed,
      rosettaStone.get('a'),
    );

    // All nodes are here
    expect(decompressed.nodes()).toHaveLength(3);
    expect(decompressed.hasNode('a')).toBeTruthy();
    expect(decompressed.hasNode('b')).toBeTruthy();
    expect(decompressed.hasNode('c')).toBeTruthy();

    // All Intra-component edges are here
    expect(decompressed.edges()).toHaveLength(3);
    expect(decompressed.edges()).toContainEqual('b-a');
    expect(decompressed.edges()).toContainEqual('c-b');
    expect(decompressed.edges()).toContainEqual('a-c');
  });

  it('should be compressing a whole graph', () => {
    const [compressedGraph, rosettaStone] = service.compressGraph(
      graph,
      expected_components,
    );

    // All components should be here
    expect(compressedGraph.nodes()).toHaveLength(3);

    // So should be the edges
    expect(rosettaStone.size).toBe(8);
    expect(
      [...rosettaStone.values()].filter((v, i, arr) => arr.indexOf(v) === i), // unique values
    ).toHaveLength(3);

    // connections between components should be okay
    expect(
      compressedGraph.hasEdge(rosettaStone.get('c'), rosettaStone.get('d')),
    ).toBeTruthy();

    expect(
      compressedGraph.hasEdge(rosettaStone.get('c'), rosettaStone.get('e')),
    ).toBeTruthy();

    expect(
      compressedGraph.hasEdge(rosettaStone.get('h'), rosettaStone.get('f')),
    ).toBeTruthy();

    // this one does'nt exists in this orientation
    expect(
      compressedGraph.hasEdge(rosettaStone.get('e'), rosettaStone.get('c')),
    ).toBeFalsy();
  });

  it('should allow to find relations between nodes that are in a single component', async () => {
    jest.spyOn(service, 'buildGraphFromNodes').mockResolvedValue(graph);

    const resultingGraph = await service.findRelations(['a', 'b', 'c'], 5);

    expect(resultingGraph).toBeDefined();
    expect(resultingGraph.nodes()).toHaveLength(3);
    expect(resultingGraph.edges()).toHaveLength(3);

    expect(resultingGraph.hasEdge('b', 'a')).toBeTruthy();
    expect(resultingGraph.hasEdge('c', 'b')).toBeTruthy();
    expect(resultingGraph.hasEdge('a', 'c')).toBeTruthy();
  });

  it('should allow to find relations between nodes that are in different components', async () => {
    jest.spyOn(service, 'buildGraphFromNodes').mockResolvedValue(graph);

    const resultingGraph = await service.findRelations(['a', 'b', 'e'], 5);

    expect(resultingGraph).toBeDefined();
    expect(resultingGraph.nodes()).toHaveLength(6);

    // the first one
    expect(resultingGraph.nodes()).toContainEqual('a');
    expect(resultingGraph.nodes()).toContainEqual('b');
    expect(resultingGraph.nodes()).toContainEqual('c');

    // the second one
    expect(resultingGraph.nodes()).toContainEqual('e');
    expect(resultingGraph.nodes()).toContainEqual('g');
    expect(resultingGraph.nodes()).toContainEqual('h');

    // Now checkin the edges
    expect(resultingGraph.edges()).toHaveLength(8);
    expect(resultingGraph.edges()).toContainEqual('b-a');
    expect(resultingGraph.edges()).toContainEqual('c-b');
    expect(resultingGraph.edges()).toContainEqual('a-c');
    expect(resultingGraph.edges()).toContainEqual('c-e');
    expect(resultingGraph.edges()).toContainEqual('e-g');
    expect(resultingGraph.edges()).toContainEqual('g-e');
    expect(resultingGraph.edges()).toContainEqual('g-h');
    expect(resultingGraph.edges()).toContainEqual('h-g');

    expect(resultingGraph.edges()).not.toContainEqual('h-f');
  });
});
