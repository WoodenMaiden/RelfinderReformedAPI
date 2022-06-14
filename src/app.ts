import 'dotenv/config'
import express from 'express'
import bodyParser from 'body-parser'

import cors, {CorsOptions} from 'cors';
import yargs from 'yargs';
import {MultiDirectedGraph} from "graphology";
import {Attributes} from "graphology-types";
import {bidirectional} from 'graphology-shortest-path/unweighted';
import {edgePathFromNodePath} from 'graphology-shortest-path/utils';
import { Request, Response } from 'express';

import client from './graph/endpoint'
import Queries from './graph/queries'
import RDFGraph from './graph/rdfgraph'


const jsonparse = bodyParser.json()
const app = express()

const PORT: number = parseInt(process.env.RFR_PORT, 10) || 80;
const STARTDATE = new Date()
const cpuUsage = {
    max: process.cpuUsage(),
    current : process.cpuUsage()
}
const memoryUsage = {
    max: process.memoryUsage().heapUsed,
    current: process.memoryUsage().heapUsed
}

// arguments
const args = yargs(process.argv.slice(1)).options({
    "c": {
        alias: "check-connection",
        choices: ["none", "no-crash", "strict"],
        default: "none",
        demandOption: false,
        describe: "At startup, end a sample query to the database to check its status\n\t- \"none\" : no checking, default option\n\t- \"no-crash\" : check but does not crash\n\t- \"strict\" : check and crashes if it fails",
        type: "string"
    }
    // TODO logging here
}).parseSync();

const options: CorsOptions = {origin: '*'}
app.use(cors(options));

app.get('/', (req: Request, res: Response) => {
    res.status(204).send();
})

app.get("/health", async (req: Request, res: Response) => {
    let time: number = 0
    let connectionStatus: boolean = false
    let error: Error
    const UPTIME: number = process.uptime() // Math.floor(process.uptime())

    try {
        const start: number = Date.now()
        await client.query.select(Queries.getAll({offset: 0, limit: 1}))
        time = Date.now() - start
        connectionStatus = true
    }
    catch(e: any) {
        error = e
    }
    finally {
        res.status(200).send({
            message: "OK!",
            APIVersion: "1.0.0test",
            endpoint: (connectionStatus)? { status: connectionStatus, queryTime: time }: { status: connectionStatus, error },
            ressources : {
                cpu : cpuUsage,
                memory : memoryUsage
            },
            uptime: `${Math.floor((UPTIME/60)/60)}h ${Math.floor((UPTIME/60)%60)}m ${Math.floor(UPTIME % 60)}s ${Math.floor(UPTIME % 1 *1000)}ms`,
            calculatedStart: new Date(Date.now() - UPTIME * 1000),
        });
    }

})

// app.get("/graphs", jsonparse, (req: any, res: any) => {
//     if (!req.body.nodes || req.body.nodes.length < 1) res.status(404).send({message: "please read the /docs route to see how to use this route"})
//     else sparqlclient.query.select(Queries.getGraphFromEntity(req.body.nodes[0])).then((data: RFR.GraphResults[] ) => {
//         res.status(200).send(data)
//     }).catch((err: any) => res.status(404).send(err))
// })

// app.get("/nodes", jsonparse, (req: any, res: any) => {
//     if (!req.body.graph || !req.body.limit) res.status(404).send({message: "please read the /docs route to see how to use this route"})
//     else {
//         RDFGraph.getFromGraph(req.body.graph, req.body.limit).then((data: RFR.TripleResult[]) => {
//             res.status(200).send(data)
//         }).catch(() => res.status(404).send({message: "Failed to fetch the graph! Are your parameters valid?"}))
//     }
// })


app.post(/\/relfinder\/\d+/, jsonparse, (req: Request, res: Response) => {
    const depth: number = parseInt(req.url.split('/').slice(-1)[0], 10);
    if (!req.body.nodes || req.body.nodes.length < 2)
        res.status(404).send({message: "please read the /docs route to see how to use this route"})

    else {

        RDFGraph.createFromEntities(req.body.nodes, depth).then((rdf: RDFGraph) => {

            const tmp: MultiDirectedGraph = new MultiDirectedGraph()
            const toReturn: MultiDirectedGraph = new MultiDirectedGraph()
            const SCCs: string [][] = rdf.kosaraju(req.body.nodes[0])


            function drawSCC(scc: string[]) {
                for (const subject of scc){
                    if (!toReturn.hasNode(subject)) toReturn.addNode(subject)

                    // draw litterals
                    const litterals: string[] = rdf.graph.outNeighbors(subject).filter((node: string) => !node.match(/^.+:\/\/.*/ig))

                    litterals.forEach((elt: string) => {
                        if (!toReturn.hasNode(elt)) toReturn.addNode(elt)
                        rdf.graph.forEachDirectedEdge(subject, elt,
                            (edge: string, attributes: Attributes, source: string, target: string) => {
                            if (!toReturn.hasEdge(edge)) toReturn.addDirectedEdgeWithKey(edge, source, target, attributes)
                        })
                    })

                    for (const object of scc){
                       if (!toReturn.hasNode(object)) toReturn.addNode(object)
                       rdf.graph.forEachDirectedEdge(subject, object,
                           (edge: string, attributes: Attributes, source: string, target: string) => (!toReturn.hasDirectedEdge(edge))? toReturn.addDirectedEdgeWithKey(edge, source, target, attributes) : /*pass*/ {})
                    }
                }
            }

            // First we will see if any of these SCCs contains both of our nodes, meaning that we already have all paths available,
            let sccIndex: number = 0;
            let found: boolean = false;

            while(sccIndex < SCCs.length){
                if (SCCs[sccIndex].length !==0)
                    if (SCCs[sccIndex].includes(req.body.nodes[0])
                        && SCCs[sccIndex].includes(req.body.nodes[1])){
                            found = true;
                            break
                    }

                ++sccIndex
            }

            if (found) {
                drawSCC(SCCs[sccIndex])
            }
            else { // If they are on separate SCCs
                // Since every node in a SCC is acesssible from anywhere within it, we will abstract these as nodes and apply djikstra
                let nbSCC: number = 0

                interface AssociativeArray {
                    [key: string]: string;
                }

                const nodeToSCC: AssociativeArray = {}

                for(const SCCelt of SCCs){
                    tmp.addNode(`scc${++nbSCC}`, {elements: SCCelt})
                    for (const elt of SCCelt) nodeToSCC[elt] = `scc${nbSCC}`
                }

                rdf.graph.forEachNode((node: string) => (!nodeToSCC[node])? tmp.addNode(node): "pass")


                rdf.graph.forEachEdge((edge: string, attributes: Attributes,
                    source: string, target: string) => {
                        tmp.addDirectedEdgeWithKey(
                        edge, (!nodeToSCC[source])? source: nodeToSCC[source],
                        (!nodeToSCC[target])? target: nodeToSCC[target], attributes)
                })

                const path = bidirectional(tmp,
                    (!nodeToSCC[req.body.nodes[0]])? req.body.nodes[0]: nodeToSCC[req.body.nodes[0]],
                    (!nodeToSCC[req.body.nodes[1]])? req.body.nodes[1]: nodeToSCC[req.body.nodes[1]]
                )

                const pathEdges = edgePathFromNodePath(tmp, path)
                // draw useful SCCs
                path.forEach((node: string) => {
                    if (node.substring(0,3) !== "scc") {

                        toReturn.addNode(node)
                        const litterals: string[] = rdf.graph.outNeighbors(node).filter((lit: string) => !lit.match(/^.+:\/\/.*/ig))

                        litterals.forEach((elt: string) => {
                            if (!toReturn.hasNode(elt)) toReturn.addNode(elt)
                            rdf.graph.forEachDirectedEdge(node, elt,
                                (edge: string, attributes: Attributes, source: string, target: string) => {
                                if (!toReturn.hasEdge(edge)) toReturn.addDirectedEdgeWithKey(edge, source, target, attributes)
                            })
                        })

                    }
                    else drawSCC(tmp.getNodeAttribute(node, "elements"))
                })

                // draw links
                pathEdges.forEach((link) => {
                    if (!toReturn.hasDirectedEdge(link)) toReturn.addDirectedEdgeWithKey(link, rdf.graph.source(link),
                        rdf.graph.target(link), rdf.graph.getEdgeAttributes(link))
                })

            }

            res.status(200).send((toReturn.nodes().length > 0)? toReturn: rdf.graph)

        }).catch((err: any) => {
            console.log(err)
            res.status(404).send({message: "Failed to fetch the graph! Are your parameters valid?", dt: err})
        })
    }
})

// app.get(/\/depth/, jsonparse, (req: any, res: any) => {
//     const start: string = req.body.start;
//     const graph: any = RDFGraph.depthFirstSearch(RDFGraph.graph, start, false)
//     if (!graph) res.status(400).send({message: 'subgraph could not be processed'})
//     else res.status(200).send(graph)
// })

app.listen(PORT, () => {
    console.log('\x1b[32m%s\x1b[0m' ,`Server started at port ${PORT}`);

    if (args.c !== "none") {

        console.log('\x1b[33m%s\x1b[0m', `Sending query to check endpoint's status...`);

        client.query.select(Queries.getAll({offset: 0, limit: 1})).then(() => {
            console.log('\x1b[32m%s\x1b[0m', `Endpoint ${process.env.SPARQL_ADDRESS} is reachable!\nRFR is now usable!`)
        }).catch((err: string) => {
            console.log('\x1b[31m%s\x1b[0m', `Could not reach endpoint ${process.env.SPARQL_ADDRESS}`)
            if (args.c === "strict") {
                console.log(err)
                process.exit(1)
            }
        });
    }
})

// monitoring
setInterval(() =>  {
    // CPU
    cpuUsage.current = process.cpuUsage(cpuUsage.current)
    if (cpuUsage.max.system < cpuUsage.current.system || cpuUsage.max.user < cpuUsage.current.user ) cpuUsage.max = cpuUsage.current

    // memory
    memoryUsage.current = process.memoryUsage().heapUsed
    if (memoryUsage.max < memoryUsage.current) memoryUsage.max = memoryUsage.current

}, 1000)