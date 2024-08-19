import { IsNotEmpty, IsString } from 'class-validator';

export class LabelsDTO {
  @IsNotEmpty()
  @IsString()
  node: string;
}
