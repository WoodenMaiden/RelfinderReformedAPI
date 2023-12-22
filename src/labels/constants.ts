import { Logger } from '@nestjs/common';
import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { ModelOptions } from 'sequelize';
import { LabelsModule } from './labels.module';

// tokens for injection
export const LABEL_STORE = 'LABEL_STORE';

// constants
export enum Protocol {
  POSTGRES = 'postgres',
  MYSQL = 'mysql',
  MARIADB = 'mariadb',
  HTTP = 'http',
  HTTPS = 'https',
}

export enum LabelStoreType {
  SQL,
  ELASTIC,
  NONE,
}

export const TABLENAME = 'labels';

// defaults
export const DEFAULT_LABEL_STORE_TABLE_OPTIONS: ModelOptions = {
  tableName: TABLENAME,
  timestamps: false,
  freezeTableName: true,
};

export const DEFAULT_SEQUELIZE_LABEL_STORE_ARGUMENTS: SequelizeModuleOptions = {
  define: DEFAULT_LABEL_STORE_TABLE_OPTIONS,
  autoLoadModels: true,
  synchronize: true,
  benchmark: true,
  logging: (sql, ms) => Logger.debug(`${sql} in ${ms}ms`, LabelsModule.name),
};
