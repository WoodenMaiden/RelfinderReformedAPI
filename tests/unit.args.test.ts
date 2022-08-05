process.argv = [
    '/I/like/animals', // 0 ignored
    '/especially/cats/and/seals', // 1 ignored
    'http://localhost:8888/sparql', // 2
    '--excluded-namespaces', // 3
    'http://games.local/leagueoflegends/items', // 4
    '--included-namespaces', // 5 
    'http://games.local', // 6
    'http://people.local', // 7
    '--included-graphs', // 8
    'http://localhost/data', // 9
    '--excluded-classes', // 10
    'http://games.local/warframe/types/power', // 11
    '--included-classes', // 12
    'http://people.local/types/player', // 13
    'http://games.local/leagueoflegends/types/champions',
    'http://games.local/warframe/types/frames'
] // this will be parsed by the imports below


import RDFGraph from '../src/graph/rdfgraph'
import client from '../src/graph/endpoint'
import Queries from '../src/graph/queries';

describe('Graph CLI options', () => {
    const node1: string = "http://people.local/someUser"
    const node2: string = "http://people.local/yann"

    const excludedNamespaces = process.argv[4]
    const includedNamespaces = [ ...process.argv.slice(6,8) ]
    const graphs =  [ ...process.argv.slice(9,10) ]
    const excludedClasses = [ ...process.argv.slice(11, 12) ]
    const includedClasses = [ ...process.argv.slice(13) ]

    type GraphObj = { //since I can't import my types
        graph: {
            value: string
        }
    }

    type EdgeAttributes = {
        value: string
    }

    let rdf: RDFGraph
    let nodesAndGraph: Map<string, string[]>

    beforeAll(async () => {
        jest.setTimeout(10000)
        rdf = await RDFGraph.createFromEntities([node1, node2], 8)

        const promisedGraphs: GraphObj[][] = await Promise.all(rdf.graph.nodes().map(
            (n: string) => client.query.select(Queries.getGraphFromEntity(n))
        ))

        //this associates a node and the graphs it belongs to
        nodesAndGraph = new Map(rdf.graph.nodes().map(
            (elt: string, key: number) => [elt, promisedGraphs[key].map(e => e.graph.value)]
        ))
    })

    it(`shouldn't have any node starting by ${excludedNamespaces}`, () => {
        const excludedNodes: string[] = rdf.graph.findNode((nodeName: string) => 
            nodeName.startsWith(excludedNamespaces) 
        )

        expect(rdf.graph.nodes().length).toBeGreaterThan(0)
        expect(excludedNodes).toBeUndefined()
    })

    it(`should have only nodes starting with ${includedNamespaces[0]} or ${includedNamespaces[1]}`, () => {
        const excludedNodes: string[] = rdf.graph.findNode((nodeName: string) => 
            !nodeName.startsWith(includedNamespaces[0]) && !nodeName.startsWith(includedNamespaces[1])
        )

        expect(rdf.graph.nodes().length).toBeGreaterThan(0)
        expect(excludedNodes).toBeUndefined()
    })

    it(`should have only nodes related to graphs ${graphs.join(', ')}`, () => {
        // It can happen that a node is not in the graph but is related to it via its subject or object
        // So for each node we check :
        //      - (1) if it is included in at least one of said graphs
        //      else
        //      - (2) if its subject/object is in the graphs
        // If neither of these statements are true then the node shouldn't appear
        const unwantedNodes: string[] = []

        
        function isInGraph(node: string, map: Map<string, string[]>, rdfgraph: RDFGraph): boolean {

            const nodeGraphs = map.get(node)
            if (!nodeGraphs) return false

            // (1)
            for(const g of nodeGraphs) 
                if (graphs.includes(g)) return true;

            // (2)
            let check2 = false
            rdfgraph.graph.forEachNeighbor(node, (neighbor: string) => {
                const neighborGraphs = map.get(neighbor)
                if (neighborGraphs) 
		            for(const g of neighborGraphs) 
		                if (graphs.includes(g)) check2 = true
            })

            return check2
        }
        
        nodesAndGraph.forEach(
            (val: string[], key: string, that: Map<string, string[]>) => {
                if (!isInGraph(key, that, rdf)) unwantedNodes.push(key)
            }
        )

        expect(rdf.graph.nodes().length).toBeGreaterThan(0)
        expect(unwantedNodes.length).toEqual(0)
    })

    it(`should only contain nodes having class ${includedClasses.join(', ')}`, () => {
        let excludedNodes = undefined 
        
        const edges = rdf.graph.filterEdges(
            (node: string, attributes: EdgeAttributes) => attributes.value.endsWith("#type") 
        )

        let index = 0
        while(index < edges.length) {
            console.log(rdf.graph.target(edges[index]))
            console.log(includedClasses)
            if (!includedClasses.includes(rdf.graph.target(edges[index]))){
                excludedNodes = edges[index]
                break;
            }

            ++index
        }

        expect(rdf.graph.nodes().length).toBeGreaterThan(0)
        expect(excludedNodes).toBeUndefined()
    })

    it(`shouldn't contain nodes having classes ${excludedClasses.join(', ')}`, () => {
        let excluded = undefined 
        
        const edges = rdf.graph.filterEdges(
            (node: string, attributes: EdgeAttributes) => attributes.value.endsWith("#type") 
        )

        let index = 0
        while(index < edges.length) {
            if (excludedClasses.includes(rdf.graph.target(edges[index]))){
                excluded = edges[index]
                break;
            }

            ++index
        }

        expect(rdf.graph.nodes().length).toBeGreaterThan(0)
        expect(excluded).toBeUndefined()
    })
})