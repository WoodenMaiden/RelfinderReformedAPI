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
  sparql_address: string; // This is required
  labelstore?: LabelStoreConfig;
  exclusions: Exclusions;
  graphs: string[]; // if this is null all graphs are kept
};

export type SparqlConfig = Omit<Config, 'labelstore' | 'port'>;

export default (): Config => {
  return {
    port: parseInt(process.env.PORT),
    sparql_address: process.env.SPARQL_ADDRESS,
    labelstore: process.env.LABEL_STORE_URL
      ? {
          address: process.env.LABEL_STORE_URL,
          token: process.env.LABEL_STORE_TOKEN,
        }
      : null,
    exclusions: {
      classes: process.env.EXCLUDED_CLASSES?.split(' ') ?? [],
      namespaces: process.env.EXCLUDED_NAMESPACES?.split(' ') ?? [],
    },
    graphs: process.env.GRAPHS?.split(' ') ?? [],
  };
};
