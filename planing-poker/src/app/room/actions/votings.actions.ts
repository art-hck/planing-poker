import { Uuid } from '@common/models';
import { Voting } from '@common/models/voting';

export namespace Votings {
  export class Fetch {
    static readonly type = '[Votings] Fetch';

    constructor(public votings: Voting<true>[]) {}
  }

  export class Vote {
    static readonly type = '[Votings] Voted';

    constructor(public userId: Uuid, public votingId: Uuid, public point?: string) {}
  }

  export class Unvote {
    static readonly type = '[Votings] Unvoted';

    constructor(public userId: Uuid, public votingId: Uuid) {}
  }

  export class Flip {
    static readonly type = '[Votings] Flip';

    constructor(public voting: Voting<true>) {}
  }

  export class Restart {
    static readonly type = '[Votings] Restart';

    constructor(public voting: Voting<true>) {}
  }

  export class Activate {
    static readonly type = '[Votings] Activate';

    constructor(public votingId: Uuid) {}
  }
}
