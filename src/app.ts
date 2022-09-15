import {createWriteStream} from "fs"

import 'dotenv/config'
import express from 'express'
import bodyParser from 'body-parser'
import { Op } from "sequelize";
import { Sequelize } from "sequelize-typescript";


import { Literal } from 'rdf-js'
import cors, {CorsOptions} from 'cors';
import {MultiDirectedGraph} from "graphology";
import {Attributes} from "graphology-types";
import {bidirectional} from 'graphology-shortest-path/unweighted';
import {edgePathFromNodePath} from 'graphology-shortest-path/utils';
import { Request, Response } from 'express';

import { args, LEVELS } from "./utils/args";
import client, {endpoint} from './graph/endpoint'
import Queries from './graph/queries'
import RDFGraph from './graph/rdfgraph'
import Logger from './utils/logger';
import { initSequelize, fillDB } from "./labelStore/labelStore";
import Label from "./labelStore/label";


const jsonparse = bodyParser.json()
const app = express()
let sequelize: Sequelize;


const cpuUsage = {
    max: process.cpuUsage(),
    current : process.cpuUsage()
}
const memoryUsage = {
    max: process.memoryUsage().heapUsed,
    current: process.memoryUsage().heapUsed
}

const options: CorsOptions = {origin: '*'}
app.use(cors(options));

app.get('/', (req: Request, res: Response) => {
    res.status(204).send();
})

app.get("/health", async (req: Request, res: Response) => {
    const UPTIME: number = process.uptime()
    const queries = []

    // return either the elapsed time of query or the error
    const mesureQueryTime = async (promise: Promise<unknown>) => {
            const start: number = Date.now()
            await promise
            return Date.now() - start

    }

    queries.push(mesureQueryTime(client.query.select(Queries.getAll({offset: 0, limit: 1}))))
    if (sequelize) queries.push(mesureQueryTime(sequelize.authenticate()))

    const timings = (await Promise.allSettled(queries))
        .map(t => (t.status === 'fulfilled')? t.value : -1)

    Logger.debug(JSON.stringify(timings))

    res.status(200).send({
        message: "OK!",
        APIVersion: "1.0.0test",
        endpoint: timings[0],
        ...(timings.length >= 2)? { labelStore: timings[1] }: null,
        ressources : {
            cpu : cpuUsage,
            memory : memoryUsage
        },
        uptime: `${Math.floor((UPTIME/60)/60)}h ${Math.floor((UPTIME/60)%60)}m ${Math.floor(UPTIME % 60)}s ${Math.floor(UPTIME % 1 *1000)}ms`,
        calculatedStart: new Date(Date.now() - UPTIME * 1000),
    });

})

app.post(/\/relfinder\/\d+/, jsonparse, (req: Request, res: Response) => {
    const depth: number = parseInt(req.url.split('/').slice(-1)[0], 10);
    if (!req.body.nodes || req.body.nodes.length < 2)
        res.status(400).send({message: "please read the /docs route to see how to use this route"})

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
            Logger.error(err)
            res.status(404).send({message: "Failed to fetch the graph! Are your parameters valid?", dt: err})
        })
    }
})

app.post("/labels", jsonparse, async (req: Request, res: Response) => {
    if (!req.body.node && typeof req.body.node !== "string")
        res.status(400).send({message: "please read the /docs route to see how to use this route"});
    else {
        try {
            const node = req.body.node.toLowerCase();
            const isURI = node.match(/\w+:\/\/.*/i)? true: false

            const promises: Promise<any[]>[] = [
                (isURI)? client.query.select(Queries.getLabels(node)): client.query.select(Queries.getByLabel(node)),
            ]

            if (sequelize) promises.push(
                Label.findAllAndMap({
                    where: {
                        ...(isURI)? { s: { [Op.like]: `${node}%` } }
                                : { label: { [Op.like]: `%${node}%` } }
                    },
                })
            )

            const labels = await Promise.any(promises)

            Logger.debug(JSON.stringify(labels))

            res.status(200).send({ labels })
        } catch (exception: unknown) {
            Logger.error(JSON.stringify(exception))
            res.status(500).send(JSON.stringify(exception))
        }
    }
})



app.listen(args.p, async () => {
    if (args.l.length === 0) Logger.init([process.stdout], LEVELS.indexOf(args.loglevel))
    else {
        Logger.init(
            args.l.map(file => {
                switch(file.toLowerCase()){
                    case "/dev/stdout":
                        return process.stdout
                    case "/dev/stderr":
                        return process.stderr
                    default:
                        return createWriteStream(file, {encoding: "utf-8", flags: "a"})
                }
            }),
            LEVELS.indexOf(args.loglevel)
        );
    }

    Logger.info(`Server started at port ${args.p}`);

    if (args.c !== "none") {
        Logger.info(`Sending query to check endpoint's status...`);

        client.query.select(Queries.getAll({offset: 0, limit: 1})).then(() => {
            Logger.info(`Endpoint ${endpoint} is reachable! RFR is now usable!`)
        }).catch((err: string) => {
            Logger.warn(`Could not reach endpoint ${endpoint}`)
            if (args.c === "strict") {
                Logger.fatal(err.toString())
                process.exit(1)
            }
        });
    }

    const pgUrl = process.env.POSTGRES_URL ?? args.postgresConnectionUrl
    if (pgUrl){
        try {
            sequelize = await initSequelize(pgUrl)
            await fillDB(sequelize, client)
            setInterval(
                fillDB,
                2 * 60 * 60 * 1000, // every 2 hours
                sequelize,
                client
            )
        } catch (e: unknown) {
            Logger.error('Cannot setup database ' + JSON.stringify(e))
        }

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
