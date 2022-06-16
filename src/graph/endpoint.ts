import 'dotenv/config';
import ParsingClient from 'sparql-http-client/ParsingClient'

import { args } from '../utils/args';
import Logger from '../utils/logger';
import {LogLevel} from "RFR"

if (args._.length < 2 ) {
    Logger.log("Please enter an endpoint as an argument", LogLevel.FATAL)
    process.exit(1)
}

export const endpoint = args._[1] as string
const client = new ParsingClient({endpointUrl: endpoint})

export default client