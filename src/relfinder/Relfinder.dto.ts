import {
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUrl,
  ArrayMinSize,
  ValidationArguments,
} from 'class-validator';

export class RelFinderDTO {
  @IsArray()
  @IsString({ each: true })
  @IsUrl(
    {
      protocols: [
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
      ],
      require_protocol: true,
      allow_underscores: true,
    },
    {
      each: true,
      message: (validationArgs: ValidationArguments) =>
        `${validationArgs.value} is not a valid URI`,
    },
  )
  @ArrayMinSize(2)
  @IsNotEmpty({ each: true })
  @ArrayUnique()
  nodes: string[];
}
