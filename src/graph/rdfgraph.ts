import { MultiDirectedGraph } from "graphology";
import { Attributes } from "graphology-types";

import * as RFR from "RFR";
import {Literal} from "RFR";

const queries = require('./queries')
const sparqlclient = require('./endpoint')


class RDFGraph {

    static queries: typeof queries = queries;
    private _graph: MultiDirectedGraph;
    private _invertedGraph: MultiDirectedGraph;


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

    private constructor() {}

    /**
     * @description get triples from one graph
     * @param graph
     * @param limitQuery
     * @private
     */
    private static getFromGraph(graph: string, limitQuery: number): Promise<RFR.TripleResult[]> {
        return new Promise<RFR.TripleResult[]> ((resolve, reject) => {
            sparqlclient.query.select(queries.countTriplesOfGraph(graph)).then((count: RFR.CountResult[]) => {
                if (count[0].counter.value < 1) {
                    console.log('\x1b[31m%s\x1b[0m', 'No triples!')
                    reject([]);
                }
                let toResolve: RFR.TripleResult[] = []

                let offsetQuery: number = 0;
                const promises: Promise<RFR.TripleResult[]> [] = []

                do {
                    promises.push(sparqlclient.query.select(queries.getAll({graphs: [graph], offset: offsetQuery, limit: limitQuery})))
                    offsetQuery += limitQuery
                } while (offsetQuery < count[0].counter.value);

                Promise.all(promises).then((promisesArray) => {
                    for (const c of promisesArray){
                        toResolve = toResolve.concat(c);
                    }
                    console.log('\x1b[32m%s\x1b[0m', 'Fetched nodes successfully')
                    resolve(toResolve)
                }).catch((err) =>{
                    console.log('\x1b[31m%s\x1b[0m', `Error: ${err}`)
                    reject([]);
                })


            }).catch((err: any) =>{
                console.log('\x1b[31m%s\x1b[0m', err)
                reject([]);
            })
        });
    }

    private static createFromEntitiesRec(inputEntity: string, depth: number, triples: RFR.TripleResult[]): Promise<RFR.TripleResult[]|any> {
        return new Promise<RFR.TripleResult[]>((resolve, reject) => {
            if (depth < 1) resolve(triples);
            else {
                const promises: Promise<RFR.TripleResult[]>[] = [] ;
                sparqlclient.query.select(queries.getObjectsOf(inputEntity)).then((tripleOfObjects: RFR.TripleResult[]) => {

                    triples = triples.concat(tripleOfObjects)

                    for (const t of tripleOfObjects) {
                        if (this.instanceOfLiteral(t.o)) continue
                        promises.push(this.createFromEntitiesRec(t.o.value, depth - 1, triples))
                    }

                    Promise.all<RFR.TripleResult[]>(promises).then(recursedData => {
                        for (const r of recursedData)
                            triples = triples.concat(r)
                        resolve(triples)
                    }).catch((err) => reject(err));

                }).catch((err: any) => reject({ message: "Failed To fetch from endpoint", error: err}));
            }
        })
    }

    public static createFromEntities(inputEntities: string[], depth: number = 5): Promise<RDFGraph>{

        return new Promise<RDFGraph>((resolve, reject) => {
            if (inputEntities.length < 2) {
                console.log('\x1b[31m%s\x1b[0m' ,`Not enough entities, expected 2 or more, got ${inputEntities.length}`)
                reject(new RDFGraph())
            }

            const promises: Promise<RFR.TripleResult[]>[] = [];
            for (const e of inputEntities)
                promises.push(sparqlclient.query.select(queries.getObjectsOf(e)));

            Promise.all(promises).then(data => {
                const nextPromises: Promise<RFR.TripleResult[]>[] = [];
                const triples: RFR.TripleResult[] = [];

                for (const d of data)
                    for (const elt of d)
                        triples.push(elt)

                for (const d of data){
                    for (const c of d) {
                        if (this.instanceOfLiteral(c.o)) continue;

                        nextPromises.push(this.createFromEntitiesRec(c.o.value, depth - 1, triples))
                    }
                }

                Promise.all<RFR.TripleResult[]>(nextPromises).then(recursedData => {
                    const toResolve: RDFGraph = new RDFGraph()

                    for (const arr of recursedData){
                        for (const c of arr){
                            const index = triples.find(elt => elt.s.value === c.s.value && elt.p.value === c.p.value && elt.o.value.toString() === c.o.value.toString())
                            if (!index) triples.push(c);
                        }
                    }

                    toResolve.graph = new MultiDirectedGraph()
                    toResolve.invertedGraph = new MultiDirectedGraph()

                    for (const tuple of triples) {
                        if (!toResolve.graph.hasNode(tuple.s.value)) toResolve.graph.addNode(tuple.s.value)
                        if (!toResolve.graph.hasNode(tuple.o.value)) toResolve.graph.addNode(tuple.o.value)

                        toResolve.graph.addDirectedEdge(tuple.s.value, tuple.o.value, {value: tuple.p.value})

                        toResolve.graph.forEachDirectedEdge((edge: string, attributes: Attributes, source: string, target: string) => {
                            if (!toResolve.invertedGraph.hasNode(source)) toResolve.invertedGraph.addNode(source)
                            if (!toResolve.invertedGraph.hasNode(target)) toResolve.invertedGraph.addNode(target)
                            if (!toResolve.invertedGraph.hasEdge(edge)) toResolve.invertedGraph.addDirectedEdgeWithKey(edge, target, source, attributes)
                        })
                    }

                    console.log('\x1b[94m%s\x1b[0m', `graph edges = ${toResolve.graph.size}, graph nodes = ${toResolve.graph.order}`)
//                    console.log(toResolve.depthFirstSearch(toResolve.graph, inputEntities[0], depth).size)
//                    console.log(toResolve.kosaraju(inputEntities[0], '', depth))
                    toResolve.kosaraju(inputEntities[0], '', depth)
                    resolve(toResolve)

                }).catch(err => {
                    console.log(err)
                    console.log('\x1b[31m%s\x1b[0m' ,`Could not go further does your entities have neighbours ? `)
                    reject(new RDFGraph())
                });
            }).catch(err => {
                console.log(err)
                console.log('\x1b[31m%s\x1b[0m' ,`Could not get input's neighbours, do they exist ?`)
                reject(new RDFGraph())
            });
        })
    }

/*
    depthFirstSearch (baseGraph: MultiDirectedGraph, startNode: string, depth: number = 5): MultiDirectedGraph {
        if (!baseGraph.hasNode(startNode) || depth <= 0) return null;
        if (baseGraph.outNeighbors(startNode) === []) return null;

        const depthed = new MultiDirectedGraph();
        depthed.addNode(startNode) // equivalent of tagging

        baseGraph.forEachOutboundNeighbor(startNode, (neighbor: string, attributes: any): void => {
            if (!depthed.hasNode(neighbor)){
                depthed.addNode(neighbor, attributes);
                baseGraph.forEachDirectedEdge(startNode, neighbor, (edge: string, edgeAttributes: any): void => {
                    if (!depthed.hasEdge(edge)) depthed.addDirectedEdgeWithKey(edge, startNode, neighbor, edgeAttributes)
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
            if ((!genGraph.hasNode(neighbor))) {
                genGraph.addNode(neighbor, attributes)
                baseGraph.forEachDirectedEdge(node, neighbor, (edge: string, edgeAttributes: any): void => {
                    if(!genGraph.hasEdge(edge)) genGraph.addDirectedEdgeWithKey(edge, node, neighbor, edgeAttributes)
                })
            }
            this.depthFirstSearchRec(baseGraph, neighbor, depthRemaining, genGraph)
        })
    }
*/
    /**
     * @description Returns
     * @param baseGraph
     * @param startNode
     * @param depth
     */
    depthFirstSearch (baseGraph: MultiDirectedGraph, startNode: string, depth: number = 5): Map<string, string[]> {
        // https://github.com/striver79/StriversGraphSeries/blob/main/kosaRajuJava

        if (!baseGraph.hasNode(startNode) || depth <= 0) return null;
        if (baseGraph.outNeighbors(startNode) === []) return null;

        const stack: string[] = new Array<string>(startNode);
        const tagArray: string[] = new Array<string>(startNode);
        let toReturn: Map<string, string[]> =
            new Map<string, string[]>([["stack", stack], ["tagArray", tagArray]])

        baseGraph.forEachOutboundNeighbor(startNode, (neighbor: string): void => {

            if (!toReturn.get("tagArray").includes(neighbor)){
                toReturn.get("tagArray").push(neighbor);

                toReturn = this.depthFirstSearchRec(baseGraph, neighbor, depth, toReturn)
            }
        })

        toReturn.get("stack").push(startNode)
        return toReturn;
    }


    depthFirstSearchRec(baseGraph: MultiDirectedGraph, node: string, depthRemaining: number = 5, stackAndTags: Map<string, string[]>): Map<string, string[]> {
        --depthRemaining;
        if (depthRemaining <= 0) return stackAndTags;
        if (baseGraph.outNeighbors(node) === []) return stackAndTags;
        let toReturn: Map<string, string[]> = stackAndTags;

        baseGraph.forEachOutboundNeighbor(node, (neighbor: string): void => {

            if ((!toReturn.get("tagArray").includes(neighbor))) {
                toReturn.get("tagArray").push(neighbor)

                toReturn = this.depthFirstSearchRec(baseGraph, neighbor, depthRemaining, toReturn)
            }
        })

        toReturn.get("stack").push(node)
        return toReturn;
    }

    /**
     * @description Returns a Graph that has the 2 inputs nodes and all nodes in between.
     * To do so we use the Kosaraju algorithm to find strongly connected components, which will
     * find strongly connected components and thus show us all relations between the two nodes
     * https://en.wikipedia.org/wiki/Kosaraju%27s_algorithm
     *
     * @param maxMoves
     * @param node1
     * @param node2
     * @param depth
     */
    kosaraju(node1: string, node2: string, depth: number): MultiDirectedGraph {
        // TODO
        const toReturn: MultiDirectedGraph = new MultiDirectedGraph();
/*
        let map: Map<string, string[]> = this.depthFirstSearch(this.graph, node1, depth)
        const visited: string[] = map.get("tagArray")
        const stack: string[] = map.get("stack")


        for(const elt of this.graph.nodes()) {
            if(elt !== node1 && map.get("tagArray").includes(elt)) {
                console.log(elt)
                map = this.depthFirstSearch(this.graph, elt, depth)
            }
        }
*/
        return toReturn;
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

    private static instanceOfLiteral(object: any ): object is Literal {
        return 'datatype' in object;
    }
}

exports = module.exports = RDFGraph