import { NodeLabel } from "RFR";
import { StoringStrategy } from "./StoringStrategy";

import { PostgresStrategy } from "./strategies/PostgresStrategy";

enum StoringPrefixes {
  POSTGRES = "postgres",
  // MYSQL = "mysql",
  // SQLITE = "sqlite",
  HTTP = "http",
  HTTPS = "https",
  // MONGO = "mongo",
  // MONGOSRV = "mongo+srv" // https://www.mongodb.com/docs/manual/reference/connection-string/
}

export class LabelStore {
  private strategy: StoringStrategy;

  constructor(connectionURL: string) {
    switch (/^.[^\:\/]+/.exec(connectionURL)[0]) {
      case StoringPrefixes.POSTGRES:
        this.strategy = new PostgresStrategy(connectionURL);
        break;

      case StoringPrefixes.HTTP:
      case StoringPrefixes.HTTPS:
        break;

      default:
        throw new Error(`Unknown connection prefix: ${connectionURL}`);
    }
  }

  public async search(text: string): Promise<NodeLabel[]> {
    return await this.strategy.search(text);
  }

  public async ping(): Promise<number> {
    return await this.strategy.ping();
  }

  public async connect(): Promise<void> {
    return await this.strategy.connect();
  }

  public async closeConnection(): Promise<void> {
    return await this.strategy.closeConnection();
  }
}
