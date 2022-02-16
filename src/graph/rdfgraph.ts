import Graph, { MultiDirectedGraph } from "graphology";
import "@types/sparql-http-client";
import { Attributes } from "graphology-types";

const queries = require('./queries')
const sparqlclient = require('./endpoint')

interface GraphResult {
    type: string,
    value: string
}

interface EntityResult {
    type: string,
    value: string|number|null
}

interface TripleResult {
    s: EntityResult,
    p: EntityResult,
    o: EntityResult
}

interface CountResult {
    counter: number
}

class RDFGraph {

    static queries: Queries = queries;
    private _graph: MultiDirectedGraph;
    private _invertedGraph: MultiDirectedGraph;

    includedGraphs: string[];


    get graph(): any {
        return this._graph;
    }

    set graph(value: any) {
        this._graph = value;
    }

    get invertedGraph(): any {
        return this._invertedGraph;
    }

    set invertedGraph(value: any) {
        this._invertedGraph = value;
    }

    private constructor(graphsToInclude: string[]) {
        this.includedGraphs = graphsToInclude
    }

    /**
     * @description get triples from one graph
     * @param graph
     * @private
     */
    private static getFromGraph(graph: string): Promise<TripleResult[]> {
        // TODO
        // sparqlclient.query.select(queries.getAll(), {operation: 'get'})
        return new Promise<TripleResult[]> ((resolve, reject) => {
            sparqlclient.query.select(queries.countTriplesOfGraph(graph)).then(() => {
                // todo;
            });
        });
    }

    private static getFromGraphRec(graph: string,): Promise<TripleResult[]> {
        return ;
    }

    // TODO : test
    public static createFromTwoEntities(...inputEntities: string[]): Promise<RDFGraph>{

        // Promises to get graphs from args
        const graphsPromises: Promise<GraphResults[]>[] = []
        inputEntities.forEach(entity => graphsPromises.push(sparqlclient.query.select(queries.getGraphFromEntity(entity))))

        return Promise.all(graphsPromises).then(promised => {
            let graphs: string[] = []
            const tmp: string[] = []
            promised.forEach(elt => elt.forEach(gElt => graphs.push(gElt.value)))

            // Here we will keep all graphs that are common between at least two entities : we will later load these graphs se we don't load a million of tuples
            if (graphs.length < 1) return new Promise((resolve, reject) => reject(new RDFGraph([])));
            else if (graphs.length > 1)
            {
                for (const item of Object.keys(new Set<string>(graphs))) { // the set is here to get rid of duplicates
                    const firstIndex =  graphs.indexOf(item)
                    if (firstIndex === graphs.length - 1 ) continue; // if the first occurrence is the last one of course there is nothing else

                    const secondIndex = graphs.indexOf(item, firstIndex)
                    if (secondIndex !== -1 ) tmp.push(item);
                }

                graphs = tmp
            }

            return new Promise<RDFGraph>((resolve, reject) => {
                const promises: Promise<TripleResult[]>[] = []
                for (const g of graphs) {
                    promises.push(this.getFromGraph(g))
                }

                Promise.all(promises).then((returnedTriples) => {
                    const triples: TripleResult[] = []
                    returnedTriples.forEach((dt) => triples.concat(dt))

                    const toResolve = new RDFGraph([])

                    toResolve.graph(new MultiDirectedGraph())
                    toResolve.invertedGraph(new MultiDirectedGraph())

                    for (const tuple of triples) {
                        if (!toResolve.graph.hasNode(tuple.s.value)) toResolve.graph.addNode(tuple.s.value)
                        if (!toResolve.graph.hasNode(tuple.o.value)) toResolve.graph.addNode(tuple.o.value)
                        toResolve.graph.addDirectedEdge(tuple.s.value, tuple.o.value, {value: tuple.p.value})

                        toResolve.graph.forEachDirectedEdge((edge: string, attributes: Attributes, source: string, target: string) => {
                            if (!toResolve.invertedGraph.hasNode(source)) toResolve.invertedGraph.addNode(source)
                            if (!toResolve.invertedGraph.hasNode(target)) toResolve.invertedGraph.addNode(target)
                            toResolve.invertedGraph.addDirectedEdgeWithKey(edge, target, source, attributes)
                        })
                    }
                    console.log('\x1b[94m%s\x1b[0m', `graph edges = ${toResolve.graph.size}, graph nodes = ${toResolve.graph.order}`)
                    console.log('\x1b[36m%s\x1b[0m', `inverted graph edges = ${toResolve.invertedGraph.size}, graph nodes = ${toResolve.invertedGraph.order}`)
                    resolve(toResolve)
                }).catch(() => reject())
            });

        })
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