import { Client as ESCLient, estypes } from "@elastic/elasticsearch";
import { NodeLabel } from "RFR";

import { StoringStrategy } from "../StoringStrategy";
import { args } from "../../utils/args";
import Logger from "../../utils/logger";
import LabelModel from "./LabelModel";

class ElasticSearchStrategy implements StoringStrategy {
  private client: ESCLient;

  constructor(connectionURL: string) {
    const auth_token =
      process.env.LABEL_STORE_TOKEN ?? args["label-store-token"];
    this.client = new ESCLient({
      name: "RFR: Label Store",
      compression: true,
      node: connectionURL,
      auth: {
        apiKey: auth_token,
      },
    });

    Logger.info(`Connected to ES label store at ${connectionURL}`);
  }

  public async search(text: string): Promise<NodeLabel[]> {
    return this.format(
      await this.client.search<LabelModel>({
        index: "labels",
        query: {
          multi_match: {
            query: text,
            type: "best_fields",
            fields: ["label^2", "uri"],
          },
        },
      })
    );
  }

  public async ping(): Promise<number> {
    const startTimestamp = Date.now();
    await this.client.ping();
    return Date.now() - startTimestamp;
  }

  public async connect(): Promise<void> {
    this.ping();
  }

  public async closeConnection(): Promise<void> {
    await this.client.close();
  }

  format(response: estypes.SearchResponse<LabelModel>): NodeLabel[] {
    return response.hits.hits
      .sort((a, b) => b._score - a._score)
      .map<NodeLabel>((row) => ({
        label: { value: row._source.label },
        s: { value: row._source.uri },
      }));
  }
}
