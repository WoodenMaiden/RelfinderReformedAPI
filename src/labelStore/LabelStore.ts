import { NodeLabel } from "RFR";
import { StoringStrategy } from "./StoringStrategy";
import Logger from "../utils/logger";
import { PostgresStrategy } from "./strategies/PostgresStrategy";
import { ElasticSearchStrategy } from "./strategies/ElasticSearchStrategy";

enum StoringPrefixes {
  POSTGRES = "postgres",
  // MYSQL = "mysql",
  // SQLITE = "sqlite",
  HTTP = "http",
  HTTPS = "https",
}

export class LabelStore {
  private strategy?: StoringStrategy;

  constructor(connectionURL: string) {
    switch (/^.[^\:\/]+/.exec(connectionURL)[0]) {
      case StoringPrefixes.POSTGRES:
        this.strategy = new PostgresStrategy(connectionURL);
        break;

      case StoringPrefixes.HTTP:
      case StoringPrefixes.HTTPS:
        this.strategy = new ElasticSearchStrategy(connectionURL);
        break;

      default:
        Logger.info(`Unknown connection prefix: ${connectionURL}`);
        throw new Error(`Unknown connection prefix: ${connectionURL}`);
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
