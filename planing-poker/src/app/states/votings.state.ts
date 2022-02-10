import { Uuid, Votes, Voting } from "@common/models";
import { Action, Selector, State, StateContext } from "@ngxs/store";
import { Injectable } from "@angular/core";
import { Votings } from "../actions/votings.actions";
import { patch, removeItem, updateItem } from "@ngxs/store/operators";
import { insertOrPatch } from "../util/insert-or-patch.state-operator";
import Vote = Votings.Vote;
import Unvote = Votings.Unvote;
import Flip = Votings.Flip;
import Fetch = Votings.Fetch;
import Activate = Votings.Activate;
import Restart = Votings.Restart;

interface Model {
  votings: Voting<true>[];
  activeVotingId?: Uuid;
}
type Context = StateContext<Model>;

@State<Model>({
  name: 'Votings',
  defaults: ({ votings: [] })
})

@Injectable()
export class VotingsState {
  @Selector() static votings({ votings }: Model) { return votings; }
  @Selector() static activeVoting({ activeVotingId, votings }: Model) { return votings.find(({ id }) => id === activeVotingId); }

  @Action(Fetch)
  fetch({ setState }: Context, { votings }: Fetch) {
    setState(patch<Model>({
      votings: insertOrPatch<Voting<true>>((a, b) => a.id === b.id, votings)
    }));
  }

  @Action(Vote)
  vote({ setState }: Context, { userId, votingId, point }: Vote) {
    setState(patch<Model>({
      votings: updateItem(v => v?.id === votingId, patch({
        votes: insertOrPatch(v => v && v[0] === userId, [[userId, point || null]], true)
      }))
    }));
  }

  @Action(Unvote)
  unvote({ setState }: Context, { userId, votingId }: Unvote) {
    setState(patch<Model>({
      votings: updateItem(v => v?.id === votingId, patch({
        votes: removeItem<Votes<true>[number]>(a => !!a && a[0] === userId)
      }))
    }));
  }

  @Action(Flip)
  flip({ setState }: Context, { voting }: Flip) {
    setState(patch<Model>({
      votings: updateItem(v => v?.id === voting.id, patch(voting))
    }));
  }

  @Action(Restart)
  restart({ setState }: Context, { voting }: Restart) {
    setState(patch<Model>({
      votings: updateItem(v => v?.id === voting.id, patch(voting))
    }));
  }

  @Action(Activate)
  activate({ setState, getState }: Context, { votingId }: Activate) {
    if(['pristine', 'in-progress'].includes(getState().votings.find(v => v.id === getState().activeVotingId)?.status || "")) {
      setState(patch<Model>({
        votings: updateItem(item => item?.id === getState().activeVotingId, patch({
          votes: [] as Voting<true>['votes']
        }))
      }));
    }

    setState(patch<Model>({ activeVotingId: votingId }));
  }
}
