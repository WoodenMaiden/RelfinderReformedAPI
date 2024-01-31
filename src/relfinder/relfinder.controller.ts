import { Controller, HttpCode, Post, Body, Param } from '@nestjs/common';

import { RelFinderService } from './relfinder.service';
import { RelFinderDTO } from './Relfinder.dto';

@Controller('relfinder')
export class RelFinderController {
  constructor(private readonly relFinderService: RelFinderService) {}

  @Post(':depth')
  @HttpCode(200)
  async findRelations(
    @Body() relFinderDTO: RelFinderDTO,
    @Param('depth') depth: number,
  ) {
    return this.relFinderService.findRelations(relFinderDTO.nodes, depth);
  }
}
