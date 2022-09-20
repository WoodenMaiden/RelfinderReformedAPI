import 'dotenv/config';
import ParsingClient from 'sparql-http-client/ParsingClient'

import { args } from '../utils/args';
import Logger from '../utils/logger';
import {LogLevel} from "RFR"

if (args._.length < 2 && !process.env.SPARQL_ENDPOINT) {
    Logger.log("Please enter an endpoint as an argument, or as the env variable SPARQL_ENDPOINT", LogLevel.FATAL)
    Logger.log(`argv: ${args._}, SPARQL_ENDPOINT: ${process.env.SPARQL_ENDPOINT}`, LogLevel.FATAL)
    process.exit(1)
}

export const endpoint = process.env.SPARQL_ENDPOINT ?? args._[1] as string
const client = new ParsingClient({endpointUrl: endpoint})

export default client