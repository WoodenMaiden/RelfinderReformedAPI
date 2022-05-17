import 'dotenv/config';
import ParsingClient from 'sparql-http-client/ParsingClient'

const endpoint = process.env.SPARQL_ADDRESS
const client = new ParsingClient({endpointUrl: endpoint})

export default client