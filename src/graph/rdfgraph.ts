import { MultiDirectedGraph } from "graphology";
import { Attributes } from "graphology-types";
import { stringify } from "querystring";

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

    static nodeExists(aGraph: MultiDirectedGraph, toFind: string): boolean{
        let val;
        aGraph.findNode((node: string): any => {
            if (node === toFind) val = true;
            else val = false;
        })
        return val
    }

    static edgeExists(aGraph: MultiDirectedGraph, toFind: string): boolean {
        let val;
        aGraph.findOutEdge((edge: string): any => {
            if (edge === toFind) val = true;
            else val = false;
        })
        return val
    }

    depthFirstSearch (baseGraph: MultiDirectedGraph/* = this.graph*/, startNode: string, depth: number = 5): MultiDirectedGraph {
        if (!RDFGraph.nodeExists(baseGraph, startNode) || depth <= 0) return null;
        if (baseGraph.outNeighbors(startNode) === []) return null;
        const depthed = new MultiDirectedGraph();
        depthed.addNode(startNode) // equivalent of tagging

        // 👇 forloop to put in depthFirstSearchRec()
        baseGraph.forEachOutboundNeighbor(startNode, (neighbor: string, attributes: any): void => {
            if (!RDFGraph.nodeExists(depthed, neighbor)){
                depthed.addNode(neighbor, attributes);
                baseGraph.forEachDirectedEdge(startNode, neighbor, (edge: string, edgeAttributes: any): void => {
                    if (!RDFGraph.edgeExists(depthed, edge)) depthed.addDirectedEdgeWithKey(edge, startNode, neighbor, edgeAttributes)
                });
                this.depthFirstSearchRec(baseGraph, neighbor, depth, depthed)
            }
        })

        return depthed
    }

    depthFirstSearchRec(baseGraph: MultiDirectedGraph, node: string, depthRemaining: number, genGraph: MultiDirectedGraph): void {
        --depthRemaining;
        if (depthRemaining <= 0) return;
        if (baseGraph.outNeighbors(node) === []) return;

        baseGraph.forEachOutboundNeighbor(node, (neighbor: string, attributes: any): void => {
            if (!RDFGraph.nodeExists(genGraph, neighbor)) {
                genGraph.addNode(neighbor, attributes)
                baseGraph.forEachDirectedEdge(node, neighbor, (edge: string, edgeAttributes: any): void => {
                    if(!RDFGraph.edgeExists(genGraph, edge)) genGraph.addDirectedEdgeWithKey(edge, node, neighbor, edgeAttributes)
                })
            }
            this.depthFirstSearchRec(baseGraph, neighbor, depthRemaining, genGraph)
        })
    }


// TODO

    /**
     * Returns a Graph that has the 2 inputs nodes and all nocdes in between
     * @param maxMoves
     * @param node1
     * @param node2
     */
    kosaraju(maxMoves: number, node1: string, node2:string ): MultiDirectedGraph {


        return new MultiDirectedGraph()
    }

    /**
     *
     * @param maxMoves
     * @param node1
     * @param node2
     * @param nodes
     * @returns
     */
/*    multipleKosaraju(maxMoves: number, node1: string, node2: string, ...nodes: string[]): MultiDirectedGraph  {

        return new MultiDirectedGraph()
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