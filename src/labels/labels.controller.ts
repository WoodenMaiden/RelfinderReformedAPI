import {
  Controller,
  Post,
  Query,
  Body,
  DefaultValuePipe,
  ParseIntPipe,
  HttpCode,
} from '@nestjs/common';
import { LabelsService } from './labels.service';
import { LabelsDTO } from './labels.dto';
import { DEFAULT_SEARCH_OPTIONS } from './StoringStrategies';

@Controller('labels')
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Post()
  @HttpCode(200)
  async getLabels(
    @Query(
      'limit',
      new DefaultValuePipe(DEFAULT_SEARCH_OPTIONS.limit),
      ParseIntPipe,
    )
    limit: number,
    @Body() body: LabelsDTO,
  ) {
    return this.labelsService.getLabel(body.node, { limit });
  }
}
