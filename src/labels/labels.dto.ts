import { Type } from 'class-transformer';

export class LabelsDTO {
  node: string;
}

export class GetLabelsQuery {
  @Type(() => Number)
  limit: number;
}
