import {
  Column,
  DataType,
  Index,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { TSVECTOR, Op } from 'sequelize';

import StoringStrategy from './StoringStrategy';

import { NodeLabel, SearchOptions, DEFAULT_SEARCH_OPTIONS } from '../../sparql';
import { RelationnalDatabase } from './RelationnalDatabase';
import LabelModel from '../LabelModel';
import { DEFAULT_LABEL_STORE_TABLE_OPTIONS } from '../constants';

@Table({
  ...DEFAULT_LABEL_STORE_TABLE_OPTIONS,
})
export class PostgresLabelModel extends Model implements LabelModel {
  @PrimaryKey
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  label: string;

  @PrimaryKey
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  uri: string;

  // This row combines both label and uri into a single searchable field
  @Column({
    /*SQL*/
    type: `TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', "label" || ' ' || "uri")) STORED`,
    allowNull: true,
  })
  @Index({
    name: 'IDX_SEARCH',
    type: 'FULLTEXT',
    using: 'GIN',
  })
  search: typeof TSVECTOR;
}

export class PostgresStrategy
  extends RelationnalDatabase
  implements StoringStrategy
{
  constructor() {
    super(PostgresLabelModel.sequelize);
  }

  public async search(
    text: string,
    searchOptions?: SearchOptions,
  ): Promise<NodeLabel[]> {
    searchOptions = { ...DEFAULT_SEARCH_OPTIONS, ...searchOptions };

    return super.format(
      await PostgresLabelModel.findAll({
        where: {
          search: {
            [Op.match]: PostgresLabelModel.sequelize.fn(
              'to_tsquery',
              'english',
              text,
            ),
          },
        },
        order: PostgresLabelModel.sequelize.fn(
          'ts_rank',
          'search',
          PostgresLabelModel.sequelize.fn('to_tsquery', 'english', text),
        ),
        limit: searchOptions.limit,
      }),
    );
  }
}
