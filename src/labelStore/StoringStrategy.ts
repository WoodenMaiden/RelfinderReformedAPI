import { NodeLabel } from "RFR";

export interface StoringStrategy {
  search(text: string): Promise<NodeLabel[]>;
  ping(): Promise<number>;
  connect(): Promise<void>;
  closeConnection(): Promise<void>;
}

export const TABLENAME = "labels";