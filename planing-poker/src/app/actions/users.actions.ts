import { User } from "@common/models";

export namespace Users {
  export class Fetch {
    static readonly type = '[Users] Fetch';

    constructor(public users: User[]) {}
  }
}
