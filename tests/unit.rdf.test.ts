process.argv = [
    '/I/like/animals',
    '/especially/cats/and/seals', // It won't be read
    'http://localhost:8888/sparql',
    '--excluded-namespaces',
    'http://identifiers.org',
    'no-crash',
]

import { createWriteStream } from 'fs';

import Logger from '../src/utils/logger';
import RDFGraph from '../src/graph/rdfgraph'
import { MultiDirectedGraph } from "graphology"
import { Attributes } from "graphology-types";
import { args } from '../src/utils/args';


describe('Logs', () => {
    let writeSpy: any
    const toLog = "some log we're trying to write"
    const stream = createWriteStream('/dev/null', {flags: 'a'})

    Logger.init([stream], 4)

    beforeEach(() => {
        jest.clearAllMocks()
        writeSpy = jest.spyOn(stream, "write")
    })

    it('should log something with the same log level', () => {
        Logger.log(toLog, 4)
        expect(writeSpy.mock.calls[0][0]).toContain(toLog)
    })

    it('should log something with a lower log level', () => {
        Logger.log(toLog, 0)
        expect(writeSpy.mock.calls[0][0]).toContain(toLog)
    })

    it("shouldn't log something with a higher log level", () => {
        Logger.log(toLog, 5)
        expect(writeSpy).not.toHaveBeenCalled()
    })
})


describe('RDFGraph', () => {
    const node1: string = "http://purl.uniprot.org/uniprot/M7Y4A4"
    const node2: string = "http://purl.obolibrary.org/obo/GO_0030599"


    //took this graph https://youtu.be/Jb1XlDsr46o for dfs
    const entries: string[] = "abcdefgh".split('')
    const graph: MultiDirectedGraph = new MultiDirectedGraph() 
    entries.forEach(letter => graph.addNode(letter))

    graph.addDirectedEdge("a", "c")
    graph.addDirectedEdge("c", "e")
    graph.addDirectedEdge("e", "g")
    graph.addDirectedEdge("g", "e")
    graph.addDirectedEdge("b", "a")
    graph.addDirectedEdge("c", "b")
    graph.addDirectedEdge("c", "d")
    graph.addDirectedEdge("e", "f")
    graph.addDirectedEdge("g", "h")
    graph.addDirectedEdge("h", "g")
    graph.addDirectedEdge("b", "d")
    graph.addDirectedEdge("d", "f")
    graph.addDirectedEdge("f", "d")
    graph.addDirectedEdge("h", "f")


    describe('Constuction', () => {
        it("shouldn't create a RDF graph", async () => {
            const rdf: RDFGraph = await RDFGraph.createFromEntities(["a", "b"], 2)
            expect(rdf.graph.nodes().length).toBe(0)
            expect(rdf.invertedGraph.nodes().length).toBe(0)
        })

        it("should create a RDF graph", async () => {
            const rdf: RDFGraph = await RDFGraph.createFromEntities([node1, node2], 2)
            expect(rdf.graph.nodes().length).toBeGreaterThanOrEqual(1)
            expect(rdf.invertedGraph.nodes().length).toBeGreaterThanOrEqual(1)
        })
    })

    describe('DFS', () => {
        //mock rdf graph
        const rdf = new RDFGraph()

        it("should properly fill the stack and the visited array", () => {
            rdf.depthFirstSearch(graph, "a", true)

            expect(rdf.visited.length).toBe(graph.nodes().length)
            expect(rdf.visited.length).toEqual(rdf.visited.length)

            rdf.emptyStack()
            rdf.emptyVisited()
        })

        it("should have a valid visit stack", () => {
            //it is valid if all nodes are present only one time

            rdf.depthFirstSearch(graph, "a", false)
            const filtered = new Set<string>(rdf.visited)

            expect(rdf.visited.length).toEqual(filtered.size)
                        
            rdf.emptyVisited()
        })
    })

    describe('Kosaraju', () => {
        //mock rdf graph
        const rdf = new RDFGraph()
        rdf.graph = graph

        const igraph = MultiDirectedGraph.from(graph.export()) 
        igraph.clearEdges()
        graph.forEachDirectedEdge((edge: string, attributes: Attributes, 
                                    source: string, target: string) => {
            igraph.addDirectedEdgeWithKey(edge, target, source, attributes)
        })

        rdf.invertedGraph = igraph

        it("should properly fill the stack and the visited array", () => {

            //the map instructyion are here to harmonize results
            const sccs: string[][] = rdf.kosaraju("a").map(line => line.sort()).sort()
            const expectedOutput: string [][] = [
                ["a", "b", "c"],
                ["d", "f"],
                ["e", "g", "h"]
            ].map(line => line.sort()).sort()

            expect(sccs).toEqual(expectedOutput)
        })
    })
})


describe('Graph CLI options', () => {
    const node1 = 'http://purl.uniprot.org/uniprot/M7Y4A4'
    const node2 = 'http://purl.uniprot.org/uniprot/M7Y7E2'

    let rdf: RDFGraph

    beforeAll(async () => {
        rdf = await RDFGraph.createFromEntities([node1, node2], 3)        
    })

    it("shouldn't have any node starting by http://identifiers.org", () => {
        //TODO
    })
})