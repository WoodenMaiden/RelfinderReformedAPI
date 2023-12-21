import { Column, DataType, Index, Model, PrimaryKey, Table } from "sequelize-typescript";
import { Dialect } from "sequelize";

import { NodeLabel } from "RFR";

import { StoringStrategy, TABLENAME } from "../StoringStrategy";
import { RelationnalDatabase } from "./RelationnalDatabase";
import LabelModel from "./LabelModel";

// Since MariaDB is a fork of MySQL, we can use the same model and strategy for both
@Table({
  tableName: TABLENAME,
  freezeTableName: true,
  engine: "InnoDB",
})
export class MySQLLabelModel extends Model implements LabelModel {

  // Because mysql is unable to index the first N chars of a string
  @PrimaryKey
  @Column({
      type: DataType.UUID,
      allowNull: false,
      // Mysql cannot call functions as default values (no wonder why pg is better ;) )
      // defaultValue: DataType.UUIDV4,
  })
  id: string;

  @Column({
      type: DataType.TEXT,
      allowNull: false,
  })
  @Index({
    name: "FT_SEARCH",
    type: "FULLTEXT",
  })
  label: string;

  @Column({
      type: DataType.TEXT,
      allowNull: false,

  })
  @Index({
    name: "FT_SEARCH",
    type: "FULLTEXT",
  })
  uri: string;
}



export class MySQLStrategy
  extends RelationnalDatabase
  implements StoringStrategy
{
  constructor(connectionURL: string) {
    super();
    const dialect = connectionURL.slice(0, connectionURL.indexOf(":")) as Dialect;

    super.init(connectionURL, MySQLLabelModel, { dialect });
  }


  public async search(text: string): Promise<NodeLabel[]> {
    return super.format(
      await MySQLLabelModel.findAll({
        where: this.sequelize.literal(
          /*SQL*/ `MATCH (label, uri) AGAINST (:text IN NATURAL LANGUAGE MODE)`
        ),
        replacements: { text },
        limit: 100,
      })
    );
  }
}
