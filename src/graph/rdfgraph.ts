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



    /**
     * @description Returns
     * @param baseGraph
     * @param startNode
     */
    depthFirstSearch (baseGraph: MultiDirectedGraph, startNode: string): Map<string, string[]> {
        // inspired from https://github.com/striver79/StriversGraphSeries/blob/main/kosaRajuJava

        if (baseGraph.outNeighbors(startNode) === []) return null;

        const stack: string[] = new Array<string>(startNode);
        const tagArray: string[] = new Array<string>(startNode);
        let toReturn: Map<string, string[]> =
            new Map<string, string[]>([["stack", stack], ["tagArray", tagArray]])

        baseGraph.forEachOutboundNeighbor(startNode, (neighbor: string): void => {

            if (!toReturn.get("tagArray").includes(neighbor)){
                toReturn.get("tagArray").push(neighbor);

                toReturn = this.depthFirstSearchRec(baseGraph, neighbor, toReturn)
            }
        })

        toReturn.get("stack").push(startNode)
        return toReturn;
    }


    depthFirstSearchRec(baseGraph: MultiDirectedGraph, node: string, stackAndTags: Map<string, string[]>): Map<string, string[]> {
        if (baseGraph.outNeighbors(node) === []) return stackAndTags;

        baseGraph.forEachOutboundNeighbor(node, (neighbor: string): void => {

            if ((!stackAndTags.get("tagArray").includes(neighbor))) {
                stackAndTags.get("tagArray").push(neighbor)

                stackAndTags = this.depthFirstSearchRec(baseGraph, neighbor, stackAndTags)
            }
        })

        stackAndTags.get("stack").push(node)
        return stackAndTags;
    }


    reversedDepthFirstSearch(baseGraph: MultiDirectedGraph, startNode: string, stackAndTagged: Map<string, string[]>): string[][] {
        const SCCs: string[][] = []

        while(stackAndTagged.get("stack").length > 0) {
            const start = stackAndTagged.get("stack").pop()

            if (!stackAndTagged.get("tagArray").includes(start)) {
                const newLength: number = SCCs.push(this.reversedDepthFirstSearchRec(baseGraph, start, stackAndTagged.get("tagArray")))
                stackAndTagged.set("tagArray",
                    stackAndTagged.get("tagArray").concat(SCCs[newLength-1])
                        .filter(elt => stackAndTagged.get("tagArray").indexOf(elt) === stackAndTagged.get("tagArray").lastIndexOf(elt)))
            }
        }
        return SCCs;
    }


    reversedDepthFirstSearchRec(baseGraph: MultiDirectedGraph, node: string, visited: string[]): string[] {
        if (baseGraph.outNeighbors(node) === []) return visited;
            baseGraph.forEachOutboundNeighbor(node, (neighbor: string): void => {
                if (!visited.includes(neighbor)) {
                    visited.push(neighbor)

                    visited = this.reversedDepthFirstSearchRec(baseGraph, neighbor, visited)
                }
            })
        return visited.filter(elt => visited.indexOf(elt) === visited.lastIndexOf(elt))
    }


    /**
     * @description Returns a matrix of all Strongly Connected Components (SCC)
     * To do so we use the Kosaraju algorithm to find strongly connected components, which will
     * find strongly connected components and thus show us all relations between the two nodes
     * https://en.wikipedia.org/wiki/Kosaraju%27s_algorithm
     *
     * @param node1
     */
    kosaraju(node1: string): string[][] {
        let SCCs: string[][]

        const map: Map<string, string[]> = this.depthFirstSearch(this.graph, node1)
        map.set("tagArray", [])
        SCCs = this.reversedDepthFirstSearch(this.invertedGraph, node1, map)

        return SCCs
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