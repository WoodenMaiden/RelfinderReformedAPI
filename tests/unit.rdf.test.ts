process.argv = [
    '/I/like/animals',
    '/especially/cats/and/seals', // It won't be read
    'http://localhost:8888/sparql',
    '--excluded-namespaces',
    'http://identifiers.org',
    '--included-namespaces',
    'http://purl.uniprot.org/',
    'http://purl.obolibrary.org/obo',
    '-c',
    'no-crash',
    '--included-graphs',
    'http://www.southgreen.fr/agrold/go',
    'http://www.southgreen.fr/agrold/protein.annotations'
] // this will be parsed by the imports below

import { createWriteStream } from 'fs';

import Logger from '../src/utils/logger';
import RDFGraph from '../src/graph/rdfgraph'
import { MultiDirectedGraph } from "graphology"
import { Attributes } from "graphology-types";
import client from '../src/graph/endpoint'
import Queries from '../src/graph/queries';


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

    afterAll(() => {
        stream.destroy()
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
            const rdf: RDFGraph = await RDFGraph.createFromEntities(["a", "b"], 1)
            expect(rdf.graph.nodes().length).toBe(0)
            expect(rdf.invertedGraph.nodes().length).toBe(0)
        })

        it("should create a RDF graph", async () => {
            const rdf: RDFGraph = await RDFGraph.createFromEntities([node1, node2], 1)
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
        graph.forEachDirectedEdge(
            (edge: string, attributes: Attributes, source: string, target: string) => {
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

describe('SPARQL Query Generator', () => {
    it('should get all from multiple graphs', () => {
        const query = Queries.getAll({graphs: ["http://graph1", "http://graph2"]})

        expect(query).toMatch(/FROM \<http\:\/\/graph1\> FROM <http:\/\/graph2>/i)
    })
})

describe('Graph CLI options', () => {
    const node1 = 'http://purl.uniprot.org/uniprot/M7Y4A4'
    const node2 = 'http://purl.uniprot.org/uniprot/M7Y7E2'

    type GraphObj = { //since I can't import my types
        graph: {
            value: string
        }
    }

    let rdf: RDFGraph
    let nodesAndGraph: Map<string, string[]>

    beforeAll(async () => {
        jest.setTimeout(10000)
        rdf = await RDFGraph.createFromEntities([node1, node2], 3)

        const promisedGraphs: GraphObj[][] = await Promise.all(rdf.graph.nodes().map(
            (n: string) => client.query.select(Queries.getGraphFromEntity(n))
        ))

        //this associates a node and the graphs it belongs to
        nodesAndGraph = new Map(rdf.graph.nodes().map(
            (elt: string, key: number) => [elt, promisedGraphs[key].map(e => e.graph.value)]
        ))
    })

    it("shouldn't have any node starting by http://identifiers.org/", () => {
        const excludedNodes: string[] = rdf.graph.findNode((nodeName: string) => 
            nodeName.startsWith("http://identifiers.org") 
        )

        expect(excludedNodes).toBeUndefined()
    })

    it ('should have only nodes starting with http://purl.uniprot.org/ or http://purl.obolibrary.org/obo', () => {
        const excludedNodes: string[] = rdf.graph.findNode((nodeName: string) => 
            !nodeName.startsWith("http://purl.uniprot.org/") && !nodeName.startsWith("http://purl.obolibrary.org/obo")
        )

        expect(excludedNodes).toBeUndefined()
    })

    it('should have only nodes related to graphs http://www.southgreen.fr/agrold/protein.annotations and http://www.southgreen.fr/agrold/go', () => {
        // It can happen that a node is not in the graph but is related to it via its subject or object
        // So for each node we check :
        //      - (1) if it is included in at least one of said graphs
        //      else
        //      - (2) if its subject/object is in the graphs
        // If neither of these statements are true then the node shouldn't appear
        const unwantedNodes: string[] = []

        
        function isInGraph(node: string, map: Map<string, string[]>, rdfgraph: RDFGraph): boolean {
            const wantedGraphs = [
                'http://www.southgreen.fr/agrold/protein.annotations',
                'http://www.southgreen.fr/agrold/go'
            ]

            const nodeGraphs = map.get(node)
            if (!nodeGraphs) return false

            // (1)
            for(const g of nodeGraphs) 
                if (wantedGraphs.includes(g)) return true;

            // (2)
            let check2 = false
            rdfgraph.graph.forEachNeighbor(node, (neighbor: string) => {
                const neighborGraphs = map.get(neighbor)
                if (neighborGraphs) 
		            for(const g of neighborGraphs) 
		                if (wantedGraphs.includes(g)) check2 = true
            })

            return check2
        }
        
        nodesAndGraph.forEach(
            (val: string[], key: string, that: Map<string, string[]>) => {
                if (!isInGraph(key, that, rdf)) unwantedNodes.push(key)
            }
        )

        expect(unwantedNodes.length).toEqual(0)
    })

    it.skip('should only contain nodes having a certain class', () => {

    })

    it.skip("shouldn't contain nodes having a certain class", () => {

    })
})