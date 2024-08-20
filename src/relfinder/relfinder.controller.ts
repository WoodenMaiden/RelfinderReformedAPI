import {
  Controller,
  HttpCode,
  Post,
  Body,
  Param,
  Logger,
} from '@nestjs/common';

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
    const { nodes } = relFinderDTO;

    Logger.debug(
      `Finding relations with max depth ${depth}`,
      RelFinderController.name,
    );

    return this.relFinderService.findRelations(
      await this.relFinderService.buildGraphFromNodes(nodes, depth),
      nodes,
    );
  }
}
