import { Sequelize, SequelizeOptions, ModelCtor, Model } from "sequelize-typescript";

import { NodeLabel } from "RFR";

import Logger from "../../utils/logger";
import LabelRelationalModel from "./LabelRelationnalModel";

export abstract class RelationnalDatabase {
  protected sequelize: Sequelize;

  async init(
    connectionURL: string,
    model: ModelCtor<Model<any, any>>,
    options: SequelizeOptions = {}
  ) {
    const databaseType = options.dialect ?? "Labelstore";
    this.sequelize = new Sequelize(connectionURL, {
      logging: (msg, time) =>
        Logger.debug(`${databaseType}: ${msg}${time ? ` (${time}ms)` : ""}`),
      benchmark: true,
      define: {
        freezeTableName: true,
        timestamps: false,
        ...options.define,
      },
      ...options,
    });

    this.sequelize.addModels([model]);

    Logger.debug(`${databaseType}: Added model ${model.name} to sequelize`);

    await this.connect();
    await this.sequelize.sync();
  }

  public async ping(): Promise<number> {
    const startTimestamp = Date.now();
    await this.sequelize.authenticate();
    return Date.now() - startTimestamp;
  }

  public async connect(): Promise<void> {
    await this.sequelize.authenticate();
  }

  public async closeConnection(): Promise<void> {
    await this.sequelize.close();
  }

  protected format(result: LabelRelationalModel[]): NodeLabel[] {
    return result.map<NodeLabel>((row) => ({
      label: { value: row.label },
      s: { value: row.uri },
    }));
  }
}
