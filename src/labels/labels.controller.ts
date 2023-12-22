import { Controller, Post, Query, Body, Logger } from '@nestjs/common';
import { LabelsService } from './labels.service';
import { LabelsDTO, GetLabelsQuery } from './labels.dto';

@Controller('labels')
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Post()
  async getLabels(
    @Query() queryParams: GetLabelsQuery,
    @Body() body: LabelsDTO,
  ) {
    Logger.debug(body);
    return this.labelsService.getLabel(body.node, { limit: queryParams.limit });
  }
}
