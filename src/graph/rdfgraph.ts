import { MultiDirectedGraph } from "graphology";
import { Attributes } from "graphology-types";

import * as RFR from "RFR";
import {Literal} from "RFR";

import queries from'./queries'
import client from './endpoint'


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

    get visited(): string[] {
        return this._stack
    }

    set stack(value: string[]) {
        this.stack = value;
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


    public constructor() {}

    /**
     * @description get triples from one graph
     * @param graph
     * @param limitQuery
     * @private
     */
    private static getFromGraph(graph: string, limitQuery: number): Promise<RFR.TripleResult[]> {
        return new Promise<RFR.TripleResult[]> ((resolve, reject) => {
            client.query.select(queries.countTriplesOfGraph(graph)).then((count: any[]) => {
                if (count[0].counter.value < 1) {
                    console.log('\x1b[31m%s\x1b[0m', 'No triples!')
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
                client.query.select(queries.getObjectsOf(inputEntity)).then((tripleOfObjects:any []) => {

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

            const promises: Promise<any[]>[] = [];
            for (const e of inputEntities)
                promises.push(client.query.select(queries.getObjectsOf(e)));

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
    depthFirstSearch (baseGraph: MultiDirectedGraph, startNode: string, stacking: boolean): void {

        if (baseGraph.outNeighbors(startNode) === []) return null;

        this._visited.push(startNode)

        baseGraph.forEachOutboundNeighbor(startNode, (neighbor: string): void => {

            if (!this._visited.includes(neighbor)){
                this.depthFirstSearchRec(baseGraph, neighbor, stacking)
            }
        })

        if (stacking) this._stack.push(startNode)
    }


    depthFirstSearchRec(baseGraph: MultiDirectedGraph, node: string, stacking: boolean): void {
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
     * @param node1
     */
    kosaraju(node1: string): string[][] {

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

export default RDFGraph