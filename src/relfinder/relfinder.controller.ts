import {
  Controller,
  HttpCode,
  Post,
  Body,
  Param,
  Logger,
  BadRequestException,
} from '@nestjs/common';

import { RelFinderService } from './relfinder.service';
import { RelFinderDTO } from './Relfinder.dto';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';

@Controller('relfinder')
export class RelFinderController {
  constructor(private readonly relFinderService: RelFinderService) {}

  @Post(':depth')
  @HttpCode(200)
  @ApiOkResponse({
    description:
      'Returns a graph showing all the relations between the given entities',
  })
  @ApiBadRequestResponse({
    description:
      'Thrown when the depth is less than 1 or when less than 2 nodes are provided, or when the nodes are not URIS',
  })
  @ApiParam({
    type: Number,
    name: 'depth',
    description:
      'The maximum depth to search for relations, must be greater than 0',
  })
  async findRelations(
    @Body() relFinderDTO: RelFinderDTO,
    @Param('depth') depth: number,
  ) {
    const { nodes } = relFinderDTO;

    if (depth < 1) {
      throw new BadRequestException('Depth must be greater than 0');
    }

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
