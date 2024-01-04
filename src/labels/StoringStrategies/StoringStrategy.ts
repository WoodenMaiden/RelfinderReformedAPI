import { NodeLabel, SearchOptions } from '../../sparql';

export default interface StoringStrategy {
  getName(): string;
  search(text: string, searchOptions?: SearchOptions): Promise<NodeLabel[]>;
  ping(): Promise<number>;
  connect(): Promise<void>;
  closeConnection(): Promise<void>;
}
