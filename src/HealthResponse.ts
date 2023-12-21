import { CpuUsage, MemoryUsage } from './api_stats';

export type HealthResponse = {
  message: string;
  APIVersion: string;
  endpoint: {
    url: string;
    time: number;
  };
  labelStore?: {
    time: number;
  };
  ressources: {
    cpu: CpuUsage;
    memory: MemoryUsage;
  };
  uptime: string;
  calculatedStart: number;
};
