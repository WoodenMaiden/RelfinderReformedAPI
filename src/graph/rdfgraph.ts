import Graph, { MultiDirectedGraph } from "graphology";
import { Attributes } from "graphology-types";
// TODO import this
// @ts-ignore
import  {Md5} from "ts-md5";

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
        // REFACTORING IN PROGRESS

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
                    triples.concat(d)

                for (const d of data){
                    for (const c of d) {
                        if (this.instanceOfLiteral(c.o)) {
                            // console.log("litteral!")
                            continue;
                        }
                        nextPromises.push(this.createFromEntitiesRec(c.o.value, depth - 1, triples))
                    }
                }

                Promise.all<RFR.TripleResult[]>(nextPromises).then(recursedData => {
                    // TODO test if edges has duplicates on construction

                    const toResolve: RDFGraph = new RDFGraph()
                    let indexedge: bigint = BigInt(0)

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

                        toResolve.graph.addDirectedEdgeWithKey(indexedge.toString(), tuple.s.value, tuple.o.value, {value: tuple.p.value})

                        toResolve.graph.forEachDirectedEdge((edge: string, attributes: Attributes, source: string, target: string) => {
                            if (!toResolve.invertedGraph.hasNode(source)) toResolve.invertedGraph.addNode(source)
                            if (!toResolve.invertedGraph.hasNode(target)) toResolve.invertedGraph.addNode(target)
                            toResolve.invertedGraph.addDirectedEdgeWithKey(edge, target, source, attributes)
                        })
                        ++indexedge
                    }

                    console.log('\x1b[94m%s\x1b[0m', `graph edges = ${toResolve.graph.size}, graph nodes = ${toResolve.graph.order}`)
                    console.log('\x1b[36m%s\x1b[0m', `inverted graph edges = ${toResolve.invertedGraph.size}, graph nodes = ${toResolve.invertedGraph.order}`)
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

    private static instanceOfLiteral(object: any ): object is Literal {
        return 'datatype' in object;
    }
}

exports = module.exports = RDFGraph