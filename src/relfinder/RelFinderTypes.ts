export type TarjanNodeAttributes = {
  node: string;
  index?: number;
  lowLink?: number;
  onStack: boolean;
};

export type CompressedNodesAttributes = {
  nodes: string[];
  edges: CompressedEdges[];
};

export type CompressedEdges = {
  id: string;
  source: string;
  target: string;
  value: string;
};
