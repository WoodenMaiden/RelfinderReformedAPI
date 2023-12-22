import { NodeLabel } from '../../sparql';

export type SearchOptions = {
  limit?: number;
};

export const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  limit: 50,
};

export default interface StoringStrategy {
  getName(): string;
  search(text: string, searchOptions?: SearchOptions): Promise<NodeLabel[]>;
  ping(): Promise<number>;
  connect(): Promise<void>;
  closeConnection(): Promise<void>;
}
