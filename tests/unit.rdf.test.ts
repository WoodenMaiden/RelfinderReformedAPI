process.argv = [
    '/usr/bin/node',
    '/some/path/to/the/project/that/isnt/used/by/jest',
    '--loglevel',
    'FATAL',
    'http://localhost:8888/sparql'
]

import RDFGraph from '../src/graph/rdfgraph'
import { MultiDirectedGraph } from "graphology"
import { Attributes } from "graphology-types";


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