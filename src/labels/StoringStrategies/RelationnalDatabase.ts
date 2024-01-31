import { Sequelize } from 'sequelize';

import { NodeLabel } from '../../sparql';
import LabelModel from '../LabelModel';
import { measureQueryTime } from '../../util';

export class RelationnalDatabase {
  constructor(private readonly seq: Sequelize) {}

  protected format(result: LabelModel[]): NodeLabel[] {
    return result.map<NodeLabel>((row) => ({
      label: {
        value: row.label,
        termType: 'NamedNode',
        equals: () => false,
      },
      s: {
        value: row.uri,
        termType: 'NamedNode',
        equals: () => false,
      },
    }));
  }

  getName(): string {
    return this.seq.getDialect();
  }

  async connect(): Promise<void> {
    await this.seq.authenticate();
  }

  async closeConnection(): Promise<void> {
    await this.seq.close();
  }

  async ping(): Promise<number> {
    return (await measureQueryTime(this.seq.authenticate())).time;
  }
}
