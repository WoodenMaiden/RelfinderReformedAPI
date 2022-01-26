import { MultiDirectedGraph } from "graphology";

const Graph = require('graphology').MultiDirectedGraph;
const queries = require('./queries')
const sparqlclient = require('./endpoint')

class RDFGraph {

    static queries: Queries = queries;
    graph: /*Graph*/ any;
    invertedGraph: /*Graph*/ any;

    async init(): Promise<void> {
        const constructedGraph = new MultiDirectedGraph()
        try {
            const fetchedGraph: Record<string, Record<string, string>>[] = await sparqlclient.query.select(queries.getAll(),{operation: 'get'})
            for (const tuple of fetchedGraph ) {
                console.log('\x1b[32m%s\x1b[0m', "tuple : ");
                console.log(tuple);
                if(!("s" in tuple) || !("p" in tuple) || !("o" in tuple) ) continue;
                if (!constructedGraph.hasNode(tuple.s.value)) constructedGraph.addNode(tuple.s.value)
                if (!constructedGraph.hasNode(tuple.o.value)) constructedGraph.addNode(tuple.o.value)
                constructedGraph.addEdgeWithKey(tuple.p.value, tuple.s.value, tuple.o.value)
            }
        }
        catch (e) {
            console.log(e)
        }
        finally {
            this.graph = constructedGraph
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