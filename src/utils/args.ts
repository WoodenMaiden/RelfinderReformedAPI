import yargs from 'yargs';
import { ConnectionType } from '../labelStore/strategies/LabelModel';

export const LEVELS = ["FATAL", "ERROR", "WARN", "INFO", "DEBUG", "TRACE"];

export const args = yargs(process.argv.slice(1)).options({
    "c": {
        alias: "check-connection",
        choices: ["none", "no-crash", "strict"],
        default: "none",
        describe: "At startup, end a sample query to the database to check its status\n\t- \"none\" : no checking, default option\n\t- \"no-crash\" : check but does not crash\n\t- \"strict\" : check and crashes if it fails",
    },
    "loglevel": {
        choices: LEVELS,
        default: "INFO",
        describe: "Defines the log level. It can be either FATAL, ERROR, WARN, INFO, DEBUG or TRACE"
    },
    "l": {
        alias: "logs",
        default: [],
        demandOption: false,
        describe: "Defines files to append logs into, defaults to the standart input",
        type: "array"
    },
    "p": {
        alias: "port",
        default: 8080,
        demandOption: false,
        describe: "Port to listen on",
        type: "number"
    },
    "included-graphs": {
        default: null,
        demandOption: false,
        describe: "Defines graphs to select from in queries",
        type: "array"
    },
    "included-classes": {
        default: null,
        demandOption: false,
        describe: "Defines classes to select from in queries",
        type: "array"
    },
    "included-namespaces": {
        default: null,
        demandOption: false,
        describe: "Defines namespaces to select from in queries",
        type: "array"
    },
    "excluded-classes": {
        default: null,
        demandOption: false,
        describe: "Defines classes to exclude from in queries",
        type: "array"
    },
    "excluded-namespaces": {
        default: null,
        demandOption: false,
        describe: "Defines namespaces to exclude from in queries",
        type: "array"
    },
    "label-store-URL": {
        default: null,
        demandOption: false,
        describe: "An optionnal connection URL to a database storing labels. This comes in handy in larger datasets",
    },
    "label-store-type" : {
        default: null,
        demandOption: false,
        choices: ["postgres", "elasticsearch", "elasticsearch_graphdb"],
        describe: "The type of the label store to use. It can be inferred from the label-store-URL option.",
        coerce: (arg: string) => {
            switch (arg) {
                case "postgres":
                    return "Postgres" as ConnectionType;
                case "elasticsearch":
                    return "ElasticSearch" as ConnectionType;
                case "elasticsearch_graphdb":
                    return "ElasticSearchGraphDB" as ConnectionType;
                default:
                    return undefined;
            }
        }
    },
    "label-store-token": {
        default: null,
        demandOption: false,
        describe: "An API token to use to connect to the label store if needed (ElasticSearch for instance). It is more to secure to set the LABEL_STORE_TOKEN env variable instead.",
        type: "string"
    },
}).parseSync();