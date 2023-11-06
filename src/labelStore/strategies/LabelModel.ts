export interface LabelModel{
    label: string;
    uri: string;
}

export type ConnectionType = "Postgres" | "ElasticSearch" | "ElasticSearchGraphDB" | undefined;

export default LabelModel;