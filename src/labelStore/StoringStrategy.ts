import { NodeLabel } from "RFR";

export interface StoringStrategy {
  getName(): string;
  search(text: string): Promise<NodeLabel[]>;
  ping(): Promise<number>;
  connect(): Promise<void>;
  closeConnection(): Promise<void>;
}

export const TABLENAME = "labels";
