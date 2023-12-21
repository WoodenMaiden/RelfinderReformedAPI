import 'dotenv/config';
import ParsingClient from 'sparql-http-client/ParsingClient'
import SimpleClient from 'sparql-http-client/SimpleClient'

import { args } from '../utils/args';
import Logger from '../utils/logger';
import {LogLevel} from "RFR"

if (args._.length < 2 && !process.env.SPARQL_ADDRESS) {
    Logger.log("Please enter an endpoint as an argument, or as the env variable SPARQL_ADDRESS", LogLevel.FATAL)
    Logger.log(`argv: ${args._}, SPARQL_ADDRESS: ${process.env.SPARQL_ADDRESS}`, LogLevel.FATAL)
    process.exit(1)
}

export const endpoint = process.env.SPARQL_ADDRESS ?? args._[1] as string

const client = new ParsingClient({endpointUrl: endpoint})
export default client

export const simpleClient = new SimpleClient({endpointUrl: endpoint})