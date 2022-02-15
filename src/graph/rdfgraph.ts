import Graph, { MultiDirectedGraph } from "graphology";
import "@types/sparql-http-client";
import { Attributes } from "graphology-types";

const queries = require('./queries')
const sparqlclient = require('./endpoint')

interface GraphResults {
    type: string,
    value: string
}

class RDFGraph {

    static queries: Queries = queries;
    graph: /*Graph*/ any;
    invertedGraph: /*Graph*/ any;

    includedGraphs: string[];

    // MAJOR REFACTORING IN PROGRESS : We will only fetch concerned graphs

//    init(): Promise<void> {
//        const constructedGraph = new MultiDirectedGraph()
//        const graphToInvert = new MultiDirectedGraph()
//
//        try {
//
//        }
//        catch (e) {
//            console.log(e)
//        }
//        finally {
//            this.graph = constructedGraph
//            this.invertedGraph = graphToInvert
//            console.log('\x1b[94m%s\x1b[0m', `graph edges = ${constructedGraph.size}, graph nodes = ${constructedGraph.order}`)
//            console.log('\x1b[36m%s\x1b[0m', `inverted graph edges = ${graphToInvert.size}, graph nodes = ${graphToInvert.order}`)
//        }
//
//    }

    private constructor(graphsToInclude: string[]) {
        this.includedGraphs = graphsToInclude
    }

    /**
     * @description get triples from one graph
     * @param graph
     * @private
     */
    private static getFromGraph(graph: string): Promise<Record<string, Record<string, string>>> {
        // TODO
        // sparqlclient.query.select(queries.getAll(), {operation: 'get'})
        return ;
    }

    public static createFromTwoEntities(...inputEntities: string[])/*: Promise<RDFGraph> */{

        // Promises to get graphs from args
        // const graphsPromises: Promise<Record<string, Record<string, string>>>[] = []
        const graphsPromises: Promise<GraphResults[]>[] = []
        inputEntities.forEach(entity => graphsPromises.push(sparqlclient.query.select(queries.getGraphFromEntity(entity))))

        Promise.all(graphsPromises).then(promised => {
            const graphs: string[] = []
            promised.forEach(elt => elt.forEach(gElt => graphs.push(gElt.value)))
            graphs.sort()


            // Here we will keep all graphs that are common between at least two entities : we will later load these graphs se we don't load a million of tuples
            if (graphs.length < 1) return /*new RDFGraph()*/ ;
            else if (graphs.length > 1)
            {
                // tslint:disable-next-line:prefer-for-of
                for (let index: number = 0; index < graphs.length; ++index) {
                    if (index === 0 && (graphs[index] === graphs[index + 1]))
                        /*TODO */;
                }
            }
        })
//        return Promise.all(promises).then((resolve, reject) => {
//            resolve(new RDFGraph());
//        })
//            const toReturn = new RDFGraph(graphsToInclude)
//            toReturn.init().then(() => {
                // TODO
//                resolve(toReturn)
//            }).catch(() => reject(toReturn))
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



exports = module.exports = RDFGraph