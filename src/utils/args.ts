import yargs from 'yargs';


export const LEVELS = ["FATAL", "ERROR", "WARN", "INFO", "DEBUG", "TRACE"];

export const args = yargs(process.argv.slice(1)).options({
    "c": {
        alias: "check-connection",
        choices: ["none", "no-crash", "strict"],
        default: "none",
        demandOption: false,
        describe: "At startup, end a sample query to the database to check its status\n\t- \"none\" : no checking, default option\n\t- \"no-crash\" : check but does not crash\n\t- \"strict\" : check and crashes if it fails",
        type: "string"
    },
    "loglevel": {
        choices: LEVELS,
        default: "INFO",
        demandOption: false,
        describe: "Defines the log level. It can be either FATAL, ERROR, WARN, INFO, DEBUG or TRACE",
        type: "string"
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
    "postgres-connection-url": {
        default: null,
        demandOption: false,
        describe: "An optionnal connection URL to a Postgres database, used to store labels. This comes in handy in larger datasets",
        type: "string"
    }
}).parseSync();