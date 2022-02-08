import { User, Uuid } from "@common/models";
import { Voting } from "@common/models/voting";

export namespace Users {
  export class Fetch {
    static readonly type = '[Users] Fetch';

    constructor(public users: User[]) {}
  }

  export class FetchVotings {
    static readonly type = '[Users] FetchVotings';

    constructor(public votings: Voting<true>[]) {}
  }

  export class Voted {
    static readonly type = '[Users] Voted';

    constructor(public userId: string, public votingId: string, public point?: number) {}
  }

  export class Unvoted {
    static readonly type = '[Users] Unvoted';

    constructor(public userId: string, public votingId: string) {}
  }

  export class Flip {
    static readonly type = '[Users] Flip';

    constructor(public voting: Voting<true>) {}
  }

  export class StartVoting {
    static readonly type = '[Users] StartVoting';

    constructor(public votingId: Uuid) {}
  }

  export class EndVoting {
    static readonly type = '[Users] EndVoting';

    constructor(public votingId: Uuid) {}
  }

  export class ActivateVoting {
    static readonly type = '[Users] ActivateVoting';

    constructor(public votingId: Uuid) {}
  }
}
