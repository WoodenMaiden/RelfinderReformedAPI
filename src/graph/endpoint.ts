const ParsingClient = require('sparql-http-client')

const endpoint = 'http://sparql.southgreen.fr/'
const client = new ParsingClient({endpoint})

exports.default = client