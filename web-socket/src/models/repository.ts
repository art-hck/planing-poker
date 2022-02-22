import { Collection } from 'mongodb';

export interface Repository<T = any> {
  readonly repositoryName: string;
  init(c: Collection<T>): void;
}
