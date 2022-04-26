import { Injectable } from '@angular/core';
import { Uuid, Votes, Voting } from '@common/models';
import { Action, createSelector, Selector, State, StateContext } from '@ngxs/store';
import { patch, removeItem, updateItem } from '@ngxs/store/operators';
import { insertOrPatch } from '../../shared/util/insert-or-patch.state-operator';
import { Votings } from '../actions/votings.actions';
import Activate = Votings.Activate;
import Fetch = Votings.Fetch;
import Flip = Votings.Flip;
import Restart = Votings.Restart;
import Unvote = Votings.Unvote;
import Vote = Votings.Vote;

interface Model {
  votings: Voting<true>[];
  activeVotingId?: Uuid;
}

type Context = StateContext<Model>;

@State<Model>({
  name: 'Votings',
  defaults: ({ votings: [] }),
})

@Injectable()
export class VotingsState {
  @Selector()
  static votings({ votings }: Model) {
    return votings;
  }

  @Selector()
  static activeVoting({ activeVotingId, votings }: Model) {
    return votings.find(({ id }) => id === activeVotingId);
  }

  static voting = (id: Voting["id"]) => createSelector([VotingsState],
    (state: Model) => state.votings.find((voting) => voting.id === id) || VotingsState.activeVoting(state)
  );

  @Action(Fetch)
  fetch({ setState }: Context, { votings }: Fetch) {
    setState(patch<Model>({
      votings: insertOrPatch<Voting<true>>((a, b) => a.id === b.id, votings),
    }));
  }

  @Action(Vote)
  vote({ setState }: Context, { userId, votingId, point }: Vote) {
    setState(patch<Model>({
      votings: updateItem(v => v?.id === votingId, patch({
        status: 'in-progress',
        votes: insertOrPatch(v => v && v[0] === userId, [[userId, point || null]], true),
      })),
    }));
  }

  @Action(Unvote)
  unvote({ setState }: Context, { userId, votingId }: Unvote) {
    setState(patch<Model>({
      votings: updateItem(v => v?.id === votingId, patch({
        status: 'in-progress',
        votes: removeItem<Votes<true>[number]>(a => !!a && a[0] === userId),
      })),
    }));
  }

  @Action(Flip)
  flip({ setState }: Context, { voting }: Flip) {
    setState(patch<Model>({
      votings: updateItem(v => v?.id === voting.id, patch(voting)),
    }));
  }

  @Action(Restart)
  restart({ setState }: Context, { voting }: Restart) {
    setState(patch<Model>({
      votings: updateItem(v => v?.id === voting.id, patch(voting)),
    }));
  }

  @Action(Activate)
  activate({ setState }: Context, { votingId }: Activate) {
    setState(patch<Model>({ activeVotingId: votingId }));
  }
}
