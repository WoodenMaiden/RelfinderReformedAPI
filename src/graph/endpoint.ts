const ParsingClient = require('sparql-http-client/ParsingClient')

const endpoint = 'http://sparql.southgreen.fr'
const client = new ParsingClient({endpointUrl: endpoint})

exports = module.exports = client