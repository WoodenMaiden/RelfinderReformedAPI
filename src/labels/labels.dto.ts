import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LabelsDTO {
  @ApiProperty({
    description: 'Text to find a matching URI or Label',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  node: string;
}
