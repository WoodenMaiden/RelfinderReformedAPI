import { Inject, Injectable } from '@nestjs/common';
import { LABEL_STORE } from './constants';
import StoringStrategy, { SearchOptions } from './StoringStrategies';

@Injectable()
export class LabelsService {
  constructor(
    @Inject(LABEL_STORE) private readonly labelStore: StoringStrategy,
  ) {}

  public getLabel(text: string, searchOptions?: SearchOptions) {
    return this.labelStore.search(text, searchOptions);
  }

  public async ping() {
    return this.labelStore.ping();
  }
}
