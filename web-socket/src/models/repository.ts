import { Collection } from "mongodb";

export interface Repository<T = any> {
  readonly repositoryName: string;
  collection?: Collection<T>
  init(c: Collection<T>): void
}
