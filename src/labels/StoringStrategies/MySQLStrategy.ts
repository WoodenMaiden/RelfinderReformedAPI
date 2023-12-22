import {
  Column,
  DataType,
  Index,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

import { NodeLabel } from 'src/sparql';

import StoringStrategy, {
  SearchOptions,
  DEFAULT_SEARCH_OPTIONS,
} from './StoringStrategy';
import { RelationnalDatabase } from './RelationnalDatabase';
import LabelModel from '../LabelModel';
import { DEFAULT_LABEL_STORE_TABLE_OPTIONS } from '../constants';

// Since MariaDB is a fork of MySQL, we can use the same model and strategy for both
@Table({
  ...DEFAULT_LABEL_STORE_TABLE_OPTIONS,
  engine: 'InnoDB',
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
    name: 'FT_SEARCH',
    type: 'FULLTEXT',
  })
  label: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  @Index({
    name: 'FT_SEARCH',
    type: 'FULLTEXT',
  })
  uri: string;
}

export class MySQLStrategy
  extends RelationnalDatabase
  implements StoringStrategy
{
  constructor() {
    super(MySQLLabelModel.sequelize);
  }

  public async search(
    text: string,
    searchOptions?: SearchOptions,
  ): Promise<NodeLabel[]> {
    searchOptions = { ...DEFAULT_SEARCH_OPTIONS, ...searchOptions };

    return super.format(
      await MySQLLabelModel.findAll({
        where: MySQLLabelModel.sequelize.literal(
          /*SQL*/ `MATCH (label, uri) AGAINST (:text IN NATURAL LANGUAGE MODE)`,
        ),
        replacements: { text },
        limit: searchOptions.limit,
      }),
    );
  }
}
