import { NodeLabel } from "RFR";
import { StoringStrategy } from "./StoringStrategy";
import Logger from "../utils/logger";
import { PostgresStrategy } from "./strategies/PostgresStrategy";
import { ElasticSearchStrategy } from "./strategies/ElasticSearchStrategy";
import { ConnectionType } from "./strategies/LabelModel";

enum StoringPrefixes {
  POSTGRES = "postgres",
  // MYSQL = "mysql",
  // SQLITE = "sqlite",
  HTTP = "http",
  HTTPS = "https",
}

export class LabelStore {
  private strategy?: StoringStrategy;

  constructor(connectionUrl: string, connectionType: ConnectionType) {
    const prefix = /^.[^\:\/]+/.exec(connectionUrl)[0] as StoringPrefixes;

    switch (connectionType) {
      case "Postgres":
        if (prefix !== StoringPrefixes.POSTGRES) {
          Logger.info(`Connection type ${connectionType} does not match connection URL prefix ${prefix}`);
          throw new Error(`Connection type ${connectionType} does not match connection URL prefix ${prefix}`);
        }

        this.strategy = new PostgresStrategy(connectionUrl);
        break;
      
      case "ElasticSearch":
        if (prefix !== StoringPrefixes.HTTP && prefix !== StoringPrefixes.HTTPS) {
          Logger.info(`Connection type ${connectionType} does not match connection URL prefix ${prefix}`);
          throw new Error(`Connection type ${connectionType} does not match connection URL prefix ${prefix}`);
        }

        this.strategy = new ElasticSearchStrategy(connectionUrl);
        break;

      case "ElasticSearchGraphDB":
        Logger.error("ElasticSearchGraphDB is not implemented yet");
        throw new Error("ElasticSearchGraphDB is not implemented yet");
      
      default:
        Logger.info(`Unknown connection type: ${connectionType}`);
        throw new Error(`Unknown connection type: ${connectionType}`);
    }
  }

  public async search(text: string): Promise<NodeLabel[]> {
    return await this.strategy?.search(text);
  }

  public async ping(): Promise<number> {
    return await this.strategy?.ping();
  }

  public async connect(): Promise<void> {
    return await this.strategy?.connect();
  }

  public async closeConnection(): Promise<void> {
    return await this.strategy?.closeConnection();
  }

  public getName(): string {
    return this.strategy?.getName();
  }
}
