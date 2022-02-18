import { Readable } from "stream";

require('dotenv').config();
const express = require('express')

const sparqlclient = require('./graph/endpoint')
const queries = require('./graph/queries')
const RDFGraph = require('./graph/rdfgraph')
const bodyParser = require('body-parser')
const cors = require('cors');

const jsonparse = bodyParser.json()
const app = express()
const PORT: number = parseInt(process.env.RFR_PORT, 10) || 80;
const STARTDATE = new Date()

app.use(cors({origin: '*'}));

app.get(/^\/(?:info)?$/, (req: any, res: any) => {
    res.status(200).send({message: "OK!", APIVersion: "1.0.0test", nodeVersion: process.version, uptime: process.uptime(), startDate: STARTDATE});
})

app.get("/nodes", async (req: any, res: any) => {

    try {
        const stream: Readable = await sparqlclient.query.select(queries.getAll(), {operation: 'get'})
        res.status(200).send(stream)
    }
    catch (e){
        res.status(500).send(e)
    }
})

app.get(/relfinder\/\w+\/\w+/, (req: any, res: any) => {
    res.status(200).send(RDFGraph.graph)
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
})