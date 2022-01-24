require('dotenv').config();
const queries = require('./utils/queriesObject')
const express = require('express')

const app = express()
const PORT: number = parseInt(process.env.RFR_PORT, 10) || 80;

app.get("/info", (req: any, res: any) => {
    res.status(200).send({message: "OK!", APIVersion: "1.0.0test"});
})

app.get("/nodes", (req: any, res: any) => {
    console.log(queries)
    res.status(200).send(queries)
})

app.listen(PORT, () => {
    console.log('\x1b[32m%s\x1b[0m' ,`Server started at port ${PORT}`);
})