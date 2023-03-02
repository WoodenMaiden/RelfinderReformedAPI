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
class PostgresLabelModel extends Model implements LabelModel {
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
    type: DataType.TSVECTOR,
    allowNull: false,
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


  // TODO: rank resukts and sort them
  public async search(label: string): Promise<NodeLabel[]> {
    return super.format(
      await PostgresLabelModel.findAll({
        where: {
          search:{ [Op.match]: this.sequelize.fn("to_tsquery", label) }
        },
      })
    );
  }
}
