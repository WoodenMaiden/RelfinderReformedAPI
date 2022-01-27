import { Readable } from "stream";

require('dotenv').config();
const express = require('express')

const sparqlclient = require('./graph/endpoint')
const queries = require('./graph/queries')
const RDFGraph = require('./graph/rdfgraph')

const app = express()
const PORT: number = parseInt(process.env.RFR_PORT, 10) || 80;

app.get("/info", (req: any, res: any) => {
    res.status(200).send({message: "OK!", APIVersion: "1.0.0test"});
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

app.get(/relfinder\/\w+\/\w+/, async (req: any, res: any) => {
    res.status(200).send(RDFGraph)
})

app.listen(PORT, () => {
    console.log('\x1b[32m%s\x1b[0m' ,`Server started at port ${PORT}`);
})