import { NodeLabel } from "RFR";
import { StoringStrategy } from "./StoringStrategy";
import Logger from "../utils/logger";
import { PostgresStrategy } from "./strategies/PostgresStrategy";
import { MySQLStrategy } from "./strategies/MySQLStrategy";
import { ElasticSearchStrategy } from "./strategies/ElasticSearchStrategy";

enum Protocol {
  POSTGRES = "postgres",
  MYSQL = "mysql",
  MARIADB = "mariadb",
  HTTP = "http",
  HTTPS = "https",
}

export class LabelStore {
  private strategy?: StoringStrategy;

  constructor(connectionURL: string) {
    switch (/^.[^\:\/]+/.exec(connectionURL)[0]) {
      case Protocol.POSTGRES:
        this.strategy = new PostgresStrategy(connectionURL);
        break;

      case Protocol.MARIADB:
      case Protocol.MYSQL:
        this.strategy = new MySQLStrategy(connectionURL);
        break;

      case Protocol.HTTP:
      case Protocol.HTTPS:
        this.strategy = new ElasticSearchStrategy(connectionURL);
        break;

      default:
        Logger.error(`Unknown connection prefix: ${connectionURL}`);
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
