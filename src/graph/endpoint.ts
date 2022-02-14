require('dotenv').config();
const ParsingClient = require('sparql-http-client/ParsingClient')

const endpoint = process.env.SPARQL_ADDRESS
const client = new ParsingClient({endpointUrl: endpoint})

exports = module.exports = client