import { MultiDirectedGraph } from "graphology";
import { Attributes } from "graphology-types";

import * as RFR from "RFR";
import {Literal} from "RFR";

import queries from'./queries'
import client, {simpleClient} from './endpoint'
import Logger from "../utils/logger";
import { LogLevel } from "RFR";
import { array } from "yargs";

class RDFGraph {

    static queries: typeof queries = queries;

    private _graph: MultiDirectedGraph;
    private _invertedGraph: MultiDirectedGraph;

    // Used for reverse dfs in kosaraju algorithm
    private _stack: string[] = []
    private _visited: string[] = []

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

    get stack(): string[] {
        return this._stack
    }

    set stack(value: string[]) {
        this.stack = value;
    }

    get visited(): string[] {
        return this._stack
    }

    set visited(value: string[]) {
        this.visited = value;
    }

    public emptyStack(): string[] {
        const toreturn = this._stack
        this._stack = []
        return toreturn
    }

    public emptyVisited() {
        const toreturn = this._visited
        this._visited = []
        return toreturn
    }


    public constructor() {
        /*pass*/
    }

    /**
     * @description A recursive function get triples from a given graph
     * @param graph The URI of a RDF graph
     * @param limitQuery How many triples you fetch per request, some endpoints like virtuoso defines a maximum of triples to return
     * @return TripleResult[], a array of triples
     * @private
     */
    private static getFromGraph(graph: string, limitQuery: number): Promise<RFR.TripleResult[]> {
        return new Promise<RFR.TripleResult[]> ((resolve, reject) => {
            client.query.select(queries.countTriplesOfGraph(graph)).then((count: any[]) => {
                if (count[0].counter.value < 1) {
                    Logger.log('No triples!', LogLevel.DEBUG)
                    reject([]);
                }
                let toResolve: RFR.TripleResult[] = []

                let offsetQuery: number = 0;
                const promises: Promise<any[]> [] = []

                do {
                    promises.push(client.query.select(queries.getAll({graphs: [graph], offset: offsetQuery, limit: limitQuery})))
                    offsetQuery += limitQuery
                } while (offsetQuery < count[0].counter.value);

                Promise.all(promises).then((promisesArray) => {
                    for (const c of promisesArray){
                        toResolve = toResolve.concat(c);
                    }
                    Logger.log('Fetched nodes successfully', LogLevel.DEBUG)
                    resolve(toResolve)
                }).catch((err) =>{
                    Logger.log(`Error: ${err}`, LogLevel.DEBUG)
                    reject([]);
                })


            }).catch((err: any) =>{
                Logger.log(JSON.stringify(err), LogLevel.DEBUG)
                reject([]);
            })
        });
    }

    private static getRecursivelyFromEntities(entities: string[], depth: number): Promise<RFR.TripleResult[]> {
        Logger.trace(`getRecursivelyFromEntities(${entities}, ${depth})`)
        return simpleClient.query.select(queries.recursiveFetch(entities, depth)).then((response: Response) => {
            return response.json().then((data: RFR.SparqlSelect) => {
                // the head indicates the order of the variables in the triples
                // in our case its ?s ?p ?intermediate ?_p ?_intermediate ... ?o

                const head = data.head.vars
                const results = data.results.bindings

                Logger.debug("properties: " + head.toString() + " : " + head.length.toString())
                Logger.debug(results.length.toString())



                const triples: RFR.TripleResult[] = []

                results.forEach(line =>{
                    let indexes: number[] = []
                    head.forEach((elt, index) => {
                        if (line.hasOwnProperty(elt)) indexes.push(index)

                        if (indexes.length === 3) {
                            const toPush = {
                                s: line[head[indexes[0]]],
                                p: line[head[indexes[1]]],
                                o: line[head[indexes[2]]]
                            } as RFR.TripleResult
                            triples.push(toPush)
                            Logger.trace(JSON.stringify(toPush))
                            Logger.trace(triples.length.toString())
                            indexes = [index]
                        }
                    })
                })

                return triples
            })
        })
    }

    /**
     * @description A recursive function to create and fill a RDFGraph object
     * @param inputEntities an array of entities URIS
     * @param depth the detph of generated graph
     * @public
     * @static
     * @returns RDFGraph
     */
    public static createFromEntities(inputEntities: string[], depth: number = 5): Promise<RDFGraph>{

        return new Promise<RDFGraph>((resolve, reject) => {
            if (inputEntities.length < 2) {
                Logger.log(`Not enough entities, expected 2 or more, got ${inputEntities.length}`, LogLevel.DEBUG)
                reject(new RDFGraph())
            }


            RDFGraph.getRecursivelyFromEntities(inputEntities, depth).then((triples: RFR.TripleResult[]) => {

                Logger.debug(`Fetched ${triples.length} triples`)

                const toResolve: RDFGraph = new RDFGraph()

                toResolve.graph = new MultiDirectedGraph()
                toResolve.invertedGraph = new MultiDirectedGraph()

                for (const tuple of triples) {

                    if (!toResolve.graph.hasNode(tuple.s.value)) toResolve.graph.addNode(tuple.s.value)
                    if (!toResolve.graph.hasNode(tuple.o.value)) toResolve.graph.addNode(tuple.o.value)
                    if (!toResolve.graph.directedEdges(tuple.s.value, tuple.o.value).find(
                        (e: string) => toResolve.graph.getEdgeAttribute(e, 'value') === tuple.p.value
                    )) toResolve.graph.addDirectedEdge(tuple.s.value, tuple.o.value, {value: tuple.p.value})


                    toResolve.graph.forEachDirectedEdge((edge: string, attributes: Attributes, source: string, target: string) => {
                        if (!toResolve.invertedGraph.hasNode(source)) toResolve.invertedGraph.addNode(source)
                        if (!toResolve.invertedGraph.hasNode(target)) toResolve.invertedGraph.addNode(target)
                        if (!toResolve.invertedGraph.hasEdge(edge)) toResolve.invertedGraph.addDirectedEdgeWithKey(edge, target, source, attributes)
                    })
                }

                Logger.log(`graph edges = ${toResolve.graph.size}, graph nodes = ${toResolve.graph.order}`, LogLevel.DEBUG)
                resolve(toResolve)

            }).catch(err => {
                Logger.log(err, LogLevel.DEBUG)
                Logger.log("Could not get input's neighbours, do they exist ?", LogLevel.DEBUG)
                reject(new RDFGraph())
            });
        })
    }



    /**
     * @description fills the visited array and the stack
     * @param baseGraph a graph to visit
     * @param startNode node to start from
     * @param stacking psecifies wheter or not to fill the stack
     */
    public depthFirstSearch (baseGraph: MultiDirectedGraph, startNode: string, stacking: boolean): void {

        if (baseGraph.outNeighbors(startNode).length <= 0) return null;

        this._visited.push(startNode)

        baseGraph.forEachOutboundNeighbor(startNode, (neighbor: string): void => {

            if (!this._visited.includes(neighbor)){
                this.depthFirstSearchRec(baseGraph, neighbor, stacking)
            }
        })

        if (stacking) this._stack.push(startNode)
    }


    private depthFirstSearchRec(baseGraph: MultiDirectedGraph, node: string, stacking: boolean): void {
        this._visited.push(node)

        baseGraph.forEachOutboundNeighbor(node, (neighbor: string): void => {

            if ((!this._visited.includes(neighbor))) {
                this.depthFirstSearchRec(baseGraph, neighbor, stacking)
            }
        })

        if (stacking) this._stack.push(node)
    }

    /**
     * @description Returns a matrix of all Strongly Connected Components (SCC)
     * To do so we use the Kosaraju algorithm to find strongly connected components, which will
     * find strongly connected components and thus show us all relations between the two nodes
     * https://en.wikipedia.org/wiki/Kosaraju%27s_algorithm
     *
     * @param node1 the node to start from
     * @return string[][], SCCs
     * @public
     */
    public kosaraju(node1: string): string[][] {

        this.depthFirstSearch(this.graph, node1, true)
        this._visited = []

        const SCCs: string[][] = []
        let offset: number = 0

        // here we are doing dfs on the inverted graph, we start each time at the node on top of the stack
        while(this._stack.length > 0){
            this.depthFirstSearch(this.invertedGraph, this._stack.pop(), false)
            if (this._visited.slice(offset).length > 1 ) SCCs.push(this._visited.slice(offset))
            offset = this._visited.length
        }


        return SCCs
    }

    private static instanceOfLiteral(object: any ): object is Literal {
        return 'datatype' in object;
    }
}

export default RDFGraph