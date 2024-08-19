import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUrl,
  ArrayMinSize,
  ValidationArguments,
} from 'class-validator';

const MINIMUM_INPUT = 2;
const ALLOWED_PROTOCOLS = [
  'http',
  'https',
  'file',
  'data',
  'magnet',
  'ni',
  'tag',
  'urn:oid',
  'urn:publicid',
  'urn:sha1',
  'urn:urn-5',
  'urn:uuid',
];

export class RelFinderDTO {
  @ApiProperty({
    description: 'Array of URIs to find relations between',
    example: ['http://example.com/#entity1', 'http://example.org/#entity2'],
    minimum: MINIMUM_INPUT,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsUrl(
    {
      protocols: ALLOWED_PROTOCOLS,
      require_protocol: true,
      allow_underscores: true,
    },
    {
      each: true,
      message: (validationArgs: ValidationArguments) =>
        `${validationArgs.value} is not a valid URI`,
    },
  )
  @ArrayMinSize(MINIMUM_INPUT)
  @IsNotEmpty({ each: true })
  @ArrayUnique()
  nodes: string[];
}
