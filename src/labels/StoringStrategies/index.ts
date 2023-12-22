import StoringStrategy, {
  DEFAULT_SEARCH_OPTIONS,
  SearchOptions,
} from './StoringStrategy';
import { PostgresLabelModel, PostgresStrategy } from './PostgresStrategy';
import { MySQLLabelModel, MySQLStrategy } from './MySQLStrategy';

export default StoringStrategy;
export {
  PostgresLabelModel,
  PostgresStrategy,
  MySQLLabelModel,
  MySQLStrategy,
  DEFAULT_SEARCH_OPTIONS,
  SearchOptions,
};
