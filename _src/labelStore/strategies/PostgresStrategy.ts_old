import { Column, DataType, Index, Model, PrimaryKey, Table } from "sequelize-typescript";
import { Op, TSVECTOR } from "sequelize";

import { NodeLabel } from "RFR";

import { StoringStrategy, TABLENAME } from "../StoringStrategy";
import { RelationnalDatabase } from "./RelationnalDatabase";
import LabelModel from "./LabelModel";

@Table({
  tableName: TABLENAME,
  freezeTableName: true,
})
export class PostgresLabelModel extends Model implements LabelModel {
  @PrimaryKey
  @Column({
      type: DataType.TEXT,
      allowNull: false
  })
  label: string;

  @PrimaryKey
  @Column({
      type: DataType.TEXT,
      allowNull: false
  })
  uri: string;

  // This row combines both label and uri into a single searchable field
  @Column({
    /*SQL*/
    type: `TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', "label" || ' ' || "uri")) STORED`,
    allowNull: true,
  })
  @Index({
    name: "IDX_SEARCH",
    type: "FULLTEXT",
    using: "GIN",
  })
  search: typeof TSVECTOR;
}



export class PostgresStrategy
  extends RelationnalDatabase
  implements StoringStrategy
{
  constructor(connectionURL: string) {
    super();
    super.init(connectionURL, PostgresLabelModel, { dialect: "postgres" });
  }


  public async search(text: string): Promise<NodeLabel[]> {
    return super.format(
      await PostgresLabelModel.findAll({
        where: {
          search:{ [Op.match]: this.sequelize.fn("to_tsquery", "english", text) }
        },
        order: this.sequelize.fn("ts_rank", "search", this.sequelize.fn("to_tsquery", "english", text)),
        limit: 100,
      })
    );
  }
}
