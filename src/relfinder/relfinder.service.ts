import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';
import { MultiDirectedGraph } from 'graphology';
import { bidirectional } from 'graphology-shortest-path/unweighted';

import { cartesian } from '../util';
import { SparqlService } from '../sparql';
import {
  CompressedEdges,
  CompressedNodesAttributes,
  TarjanNodeAttributes,
} from './RelFinderTypes';

@Injectable()
export class RelFinderService {
  constructor(private readonly sparqlService: SparqlService) {}

  async buildGraphFromNodes(
    startingNodes: string[],
    maxDepth: number,
  ): Promise<MultiDirectedGraph> {
    const graph = new MultiDirectedGraph();

    const triples = await this.sparqlService.fetchGraphFrom(
      startingNodes,
      maxDepth,
    );

    // We put this in a set to remove duplicates
    const graphNodes: Set<string> = new Set(
      startingNodes.concat(
        triples.flatMap<string>((triple) => [triple.s.value, triple.o.value]),
      ),
    );

    //                             subject predicate object
    const graphEdges = triples.map<[string, string, string]>((triple) => [
      triple.s.value,
      triple.p.value,
      triple.o.value,
    ]);

    graphNodes.forEach((node) => graph.addNode(node));
    graphEdges.forEach(([s, p, o]) => graph.addEdge(s, o, { value: p }));

    return graph;
  }

  // NOTE: We change from Kosaraju to Tarjan because Tarjan's algorithm
  // is more efficient as it does not require a second pass on a transposed graph
  // Compelxity: O(|V|+|E|) where E are the edges and V are the vertices/nodes
  //
  // https://en.wikipedia.org/wiki/Tarjan%27s_strongly_connected_components_algorithm

  // Here is what is in my clipboard

  tarjansAlgorithm(graph: MultiDirectedGraph): string[][] {
    const output: string[][] = [];
    graph.nodes().forEach((node) => {
      graph.setNodeAttribute(node, 'onStack', false);
      graph.setNodeAttribute(node, 'index', null);
      graph.setNodeAttribute(node, 'lowLink', null);
    });

    const stack: string[] = [];
    let index = 0;

    const strongConnect = (node: string) => {
      graph.setNodeAttribute(node, 'index', index);
      graph.setNodeAttribute(node, 'lowLink', index);
      index += 1;
      stack.push(node);
      graph.setNodeAttribute(node, 'onStack', true);

      graph.forEachOutboundNeighbor(node, (neighbor: string) => {
        if (graph.getNodeAttribute(neighbor, 'index') === null) {
          strongConnect(neighbor);
          graph.setNodeAttribute(
            node,
            'lowLink',
            Math.min(
              graph.getNodeAttribute(node, 'lowLink'),
              graph.getNodeAttribute(neighbor, 'lowLink'),
            ),
          );
        } else if (graph.getNodeAttribute(neighbor, 'onStack')) {
          graph.setNodeAttribute(
            node,
            'lowLink',
            Math.min(
              graph.getNodeAttribute(node, 'lowLink'),
              graph.getNodeAttribute(neighbor, 'index'),
            ),
          );
        }
      });

      if (
        graph.getNodeAttribute(node, 'lowLink') ===
        graph.getNodeAttribute(node, 'index')
      ) {
        const component: string[] = [];
        let w: string;
        do {
          w = stack.pop();
          graph.setNodeAttribute(w, 'onStack', false);
          component.push(w);
        } while (w !== node);
        output.push(component);
      }
    };

    graph.forEachNode((node: string, attr: TarjanNodeAttributes) => {
      if (attr.index === null) {
        strongConnect(node);
      }
    });

    return output;
  }

  // this create a node attributes that contains:
  // - all the nodes being part of the component
  // - all the edges linking all component's member between each other
  // - all the edges linking the component's members to the rest of the graph
  compressComponent(
    graph: MultiDirectedGraph,
    component: string[],
  ): CompressedNodesAttributes {
    return {
      nodes: component,
      edges: component.reduce<CompressedEdges[]>((acc, node) => {
        graph.forEachDirectedEdge(
          node,
          (id: string, { value } /*attrs*/, source, target) => {
            if (!acc.some((edge) => edge.id === id))
              acc.push({
                id,
                source,
                target,
                value,
              });
          },
        );
        return acc;
      }, []),
    };
  }

  compressGraph(
    graph: MultiDirectedGraph,
    components: string[][],
  ): [MultiDirectedGraph, Map<string, string>] {
    const compressedGraph = new MultiDirectedGraph();
    const allEdges: CompressedEdges[] = [];

    //                        Original  Compressed
    const rosettaStone = new Map<string, string>(
      components.flatMap<[string, string]>((component) => {
        const { nodes, edges } = this.compressComponent(graph, component);
        const componentId = randomUUID();
        compressedGraph.addNode(componentId, {
          nodes,
          edges,
        } as CompressedNodesAttributes);
        allEdges.push(...edges);
        return component.map<[string, string]>((node) => [node, componentId]);
      }),
    );

    allEdges.forEach(({ source, target, value }) =>
      compressedGraph.addEdge(
        rosettaStone.get(source),
        rosettaStone.get(target),
        { value },
      ),
    );

    return [compressedGraph, rosettaStone];
  }

  async findRelations(
    startingNodes: string[],
    depth: number,
  ): Promise<MultiDirectedGraph> {
    const graph = await this.buildGraphFromNodes(startingNodes, depth);
    const connected_components = this.tarjansAlgorithm(graph);

    // we check if all the starting nodes are in the same connected component
    const indexWithAllStartingNodes = connected_components.findIndex(
      (component) => startingNodes.every((node) => component.includes(node)),
    );

    if (indexWithAllStartingNodes > -1) {
      return this.extractComponent(
        graph,
        connected_components[indexWithAllStartingNodes],
      );
    }

    // here we only keep the connected components that have more than one requested node

    // we will do that by compressing the strongly connected components into single nodes:
    // - have a smaller graph to do our pathfinding on
    // - keep as much data as possible
    //    eg. a on one run it could take a path A and ignore path which is also valid

    const [compressed, rosettaStone] = this.compressGraph(
      graph,
      connected_components,
    );

    // we erase the graph since we will reweite it at the decompressing step

    const startingCompressedNodes = startingNodes.map((node) =>
      rosettaStone.get(node),
    );

    const compressedNodesToKeep: string[] = startingCompressedNodes
      .slice(0, -1)
      .flatMap<string>((srcNode, srcIndex) =>
        startingCompressedNodes
          .slice(srcIndex + 1)
          .flatMap<string>((targetNode) =>
            bidirectional(compressed, srcNode, targetNode),
          ),
      )
      .filter((node, i, arr) => node !== null && arr.indexOf(node) === i);

    const nodesToKeep: string[] = compressedNodesToKeep.flatMap<string>(
      (compressed_node) => {
        return this.decompressComponent(compressed, compressed_node).nodes();
      },
    );

    // dropNode() also removes the edges connected to it
    graph.nodes().forEach((node) => {
      nodesToKeep.includes(node) || graph.dropNode(node);
    });

    return graph;
  }

  // the string array returned are the edges going out of the component
  decompressComponent(
    compressed_graph: MultiDirectedGraph,
    componentId: string,
  ): MultiDirectedGraph {
    const graph = new MultiDirectedGraph();
    const outgoingNodes: string[] = [];

    const { nodes, edges } = compressed_graph.getNodeAttributes(
      componentId,
    ) as CompressedNodesAttributes;

    nodes.forEach((node) => graph.addNode(node));

    edges.forEach(({ id, source, target, value }: CompressedEdges) => {
      if (nodes.includes(source))
        nodes.includes(target)
          ? graph.addDirectedEdgeWithKey(id, source, target, { value: value })
          : outgoingNodes.push(id);
    });

    return graph;
  }

  extractComponent(
    base_graph: MultiDirectedGraph,
    component: string[],
  ): MultiDirectedGraph {
    const graph = new MultiDirectedGraph();

    component.forEach((node) => graph.addNode(node));

    cartesian(component, component)
      .flatMap(([source, target]) => {
        return base_graph.edges(source, target);
      })
      .filter((edge, i, arr) => edge !== undefined && arr.indexOf(edge) === i)
      .forEach((edgeKey) => {
        const [source, target] = base_graph.extremities(edgeKey);
        const attrs = base_graph.getEdgeAttributes(edgeKey);
        graph.addDirectedEdgeWithKey(edgeKey, source, target, { attrs });
      });

    return graph;
  }
}
