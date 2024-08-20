import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';

import { RelFinderController } from './relfinder.controller';
import { RelFinderService } from './relfinder.service';
import { MultiDirectedGraph } from 'graphology';

const moduleMocker = new ModuleMocker(global);

describe('RelFinderController', () => {
  let controller: RelFinderController;
  let service: RelFinderService;
  const nodes = ['http://test.local#1', 'http://test.local#2'];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RelFinderController],
      providers: [RelFinderService],
    })
      .useMocker((token) => {
        return moduleMocker.generateFromMetadata(
          moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>,
        );
      })
      .compile();

    service = module.get<RelFinderService>(RelFinderService);
    controller = module.get<RelFinderController>(RelFinderController);

    jest
      .spyOn(service, 'buildGraphFromNodes')
      .mockImplementation(async () => new MultiDirectedGraph());
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should not return a graph with a depth less than 1', async () => {
    async function exec() {
      try {
        await controller.findRelations({ nodes }, -1);
      } catch (e) {
        return e instanceof BadRequestException;
      }
      return false;
    }

    expect(await exec()).toBeTruthy();
  });

  it('Return a graph with a depth more than 1', async () => {
    jest
      .spyOn(service, 'findRelations')
      .mockImplementation(async () => new MultiDirectedGraph());

    async function exec() {
      try {
        return await controller.findRelations({ nodes }, 3);
      } catch (e) {
        return false;
      }
    }

    expect(await exec()).toBeInstanceOf(MultiDirectedGraph);
  });
});
