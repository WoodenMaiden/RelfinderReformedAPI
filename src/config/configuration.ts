import { LogLevel } from '@nestjs/common';

export type LabelStoreConfig = {
  address: string;
  token?: string;
};

export type Exclusions = {
  classes: string[];
  namespaces: string[];
};

export type Config = {
  port: number;
  apiPrefix: string;
  sparqlAddress: string; // This is required
  labelstore?: LabelStoreConfig;
  exclusions: Exclusions;
  graphs: string[]; // if this is null all graphs are kept
  logLevel: LogLevel[];
};

const logLevelHierarchy = [
  'verbose',
  'debug',
  'warn',
  'error',
  'log',
] as LogLevel[];

export type SparqlConfig = Omit<
  Config,
  'apiPrefix' | 'labelstore' | 'port' | 'logLevel'
>;

export default (): Config => {
  return {
    port: parseInt(process.env.PORT),
    apiPrefix: process.env.API_PREFIX.trim(),
    sparqlAddress: process.env.SPARQL_ADDRESS,
    labelstore: process.env.LABEL_STORE_URL
      ? {
          address: process.env.LABEL_STORE_URL,
          token: process.env.LABEL_STORE_TOKEN,
        }
      : null,
    exclusions: {
      classes: process.env.EXCLUDED_CLASSES?.trim()
        ? process.env.EXCLUDED_CLASSES.split(' ')
        : [],
      namespaces: process.env.EXCLUDED_NAMESPACES?.trim()
        ? process.env.EXCLUDED_NAMESPACES.split(' ')
        : [],
    },
    graphs: process.env.GRAPHS?.trim() ? process.env.GRAPHS.split(' ') : [],
    logLevel: logLevelHierarchy.slice(
      logLevelHierarchy.indexOf(
        process.env.LOG_LEVEL.toLowerCase() as LogLevel,
      ),
    ),
  };
};
