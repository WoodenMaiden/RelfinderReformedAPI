process.argv = [
    '/I/like/animals',
    '/especially/cats/and/seals', // It won't be read
    'http://localhost:8888/sparql',
    '--excluded-namespaces',
    'http://identifiers.org',
    '--included-namespaces',
    'http://purl.uniprot.org/',
    'http://purl.obolibrary.org/obo',
    '--included-graphs',
    'http://www.southgreen.fr/agrold/go',
    'http://www.southgreen.fr/agrold/protein.annotations'
] // this will be parsed by the imports below


import RDFGraph from '../src/graph/rdfgraph'
import client from '../src/graph/endpoint'
import Queries from '../src/graph/queries';

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