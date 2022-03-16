require('dotenv').config();
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors');
import yargs from 'yargs';


import * as RFR from "RFR";
const sparqlclient = require('./graph/endpoint')
const queries = require('./graph/queries')
const RDFGraph = require('./graph/rdfgraph')


const jsonparse = bodyParser.json()
const app = express()
const PORT: number = parseInt(process.env.RFR_PORT, 10) || 80;
const STARTDATE = new Date()

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
}).parseSync();


app.use(cors({origin: '*'}));

app.get(/^\/(?:info)?$/, (req: any, res: any) => {
    res.status(200).send({message: "OK!", APIVersion: "1.0.0test", nodeVersion: process.version, uptime: process.uptime(), startDate: STARTDATE});
})

app.get("/graphs", jsonparse, (req: any, res: any) => {
    if (!req.body.nodes || req.body.nodes.length < 1) res.status(404).send({message: "please read the /docs route to see how to use this route"})
    else sparqlclient.query.select(queries.getGraphFromEntity(req.body.nodes[0])).then((data: RFR.GraphResults[] ) => {
        res.status(200).send(data)
    }).catch((err: any) => res.status(404).send(err))
})

app.get("/nodes", jsonparse, (req: any, res: any) => {
    if (!req.body.graph || !req.body.limit) res.status(404).send({message: "please read the /docs route to see how to use this route"})
    else {
        RDFGraph.getFromGraph(req.body.graph, req.body.limit).then((data: RFR.TripleResult[]) => {
            res.status(200).send(data)
        }).catch(() => res.status(404).send({message: "Failed to fetch the graph! Are your parameters valid?"}))
    }
})

app.get(/\/relfinder\/\d+/, jsonparse, (req: any, res: any) => {
    const depth: number = req.url.split('/').slice(-1)[0];
    if (!req.body.nodes || req.body.nodes.length < 2) res.status(404).send({message: "please read the /docs route to see how to use this route"})
    RDFGraph.createFromEntities(req.body.nodes, depth).then((graph: typeof RDFGraph) => {
        res.status(200).send(graph)
    }).catch((err: any) => res.status(404).send({message: "Failed to fetch the graph! Are your parameters valid?", dt: err}))
})

app.get(/\/depth\/\d+/, jsonparse, (req: any, res: any) => {
    const start: string = req.body.start;
    const depth: number = req.url.split('/').slice(-1)[0];
    const graph: any = RDFGraph.depthFirstSearch(RDFGraph.graph, start, depth)
    if (!graph) res.status(400).send({message: 'subgraph could not be processed'})
    else res.status(200).send(graph)
})

app.listen(PORT, () => {
    console.log('\x1b[32m%s\x1b[0m' ,`Server started at port ${PORT}`);

    sparqlclient.query.select(queries.getAll({offset: 0, limit:1})).then(() => {
        console.log('\x1b[33m%s\x1b[0m' ,`Sending query to check endpoint's status...`);
        console.log('\x1b[32m%s\x1b[0m' ,`Endpoint ${process.env.SPARQL_ADDRESS} is reachable!\nRFR is now usable!`)
    }).catch((err: string) => {
        console.log('\x1b[31m%s\x1b[0m' ,`Could not reach endpoint ${process.env.SPARQL_ADDRESS}`)
        console.log(err)
        process.exit(1)
    });
})