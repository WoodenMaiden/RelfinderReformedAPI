import { MultiDirectedGraph } from "graphology";
import { Attributes } from "graphology-types";

const Graph = require('graphology').MultiDirectedGraph;
const queries = require('./queries')
const sparqlclient = require('./endpoint')

class RDFGraph {

    static queries: Queries = queries;
    graph: /*Graph*/ any;
    invertedGraph: /*Graph*/ any;

    async init(): Promise<void> {
        const constructedGraph = new MultiDirectedGraph()
        const graphToInvert = new MultiDirectedGraph()

        try {
            const fetchedGraph: Record<string, Record<string, string>>[] = await sparqlclient.query.select(queries.getAll(),{operation: 'get'})
            for (const tuple of fetchedGraph ) {
                if(!("s" in tuple) || !("p" in tuple) || !("o" in tuple) ) continue;

                if (!constructedGraph.hasNode(tuple.s.value)) constructedGraph.addNode(tuple.s.value)
                if (!constructedGraph.hasNode(tuple.o.value)) constructedGraph.addNode(tuple.o.value)
                constructedGraph.addDirectedEdge(tuple.s.value, tuple.o.value, {value: tuple.p.value})
            }

            constructedGraph.forEachDirectedEdge((edge: string, attributes: Attributes, source: string, target: string) => {
                if (!graphToInvert.hasNode(source)) graphToInvert.addNode(source)
                if (!graphToInvert.hasNode(target)) graphToInvert.addNode(target)
                graphToInvert.addDirectedEdgeWithKey(edge, target, source, attributes)
            })
        }
        catch (e) {
            console.log(e)
        }
        finally {
            this.graph = constructedGraph
            this.invertedGraph = graphToInvert
            console.log('\x1b[94m%s\x1b[0m', `graph edges = ${constructedGraph.size}, graph nodes = ${constructedGraph.order}`)
            console.log('\x1b[36m%s\x1b[0m', `inverted graph edges = ${graphToInvert.size}, graph nodes = ${graphToInvert.order}`)
        }

    }
/*
//TODO
    kosaraju(maxMoves: number, node1: string, node2:string ): void {

    }

    multipleKosaraju(maxMoves: number, node1: string, node2: string, ...nodes: string[] ) {

    }
*/
}

const graph = new RDFGraph()

try {
    graph.init()
}
catch(e) {
    console.log(e)
}
finally {
    exports = module.exports = graph
}