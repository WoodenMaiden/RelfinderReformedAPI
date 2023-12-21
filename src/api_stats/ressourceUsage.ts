export type CpuUsage = {
  max: NodeJS.CpuUsage;
  current: NodeJS.CpuUsage;
};

export type MemoryUsage = {
  max: number;
  current: number;
};
