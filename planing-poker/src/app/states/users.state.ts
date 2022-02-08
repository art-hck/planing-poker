import { User, Uuid, Voting } from "@common/models";
import { Action, Selector, State, StateContext } from "@ngxs/store";
import { Injectable } from "@angular/core";
import { Users } from "../actions/users.actions";
import { patch, removeItem, updateItem } from "@ngxs/store/operators";
import { insertOrPatch } from "../util/insert-or-patch.state-operator";
import Fetch = Users.Fetch;
import Voted = Users.Voted;
import Unvoted = Users.Unvoted;
import Flip = Users.Flip;
import EndVoting = Users.EndVoting;
import FetchVotings = Users.FetchVotings;
import StartVoting = Users.StartVoting;
import ActivateVoting = Users.ActivateVoting;
import { mapItems } from "../util/map-items.state-operator";

interface Model {
  users: (User & { voted?: boolean })[];
  votings: Voting<true>[];
  activeVotingId?: Uuid;
}
type Context = StateContext<Model>;

@State<Model>({
  name: 'NormalizationPosition',
  defaults: ({ users: [], votings: [] })
})

@Injectable()
export class UsersState {
  @Selector() static users({ users }: Model) { return users }
  @Selector() static votings({ votings }: Model) { return votings; }
  @Selector() static activeVoting({ activeVotingId, votings }: Model) { return votings.find(({ id }) => id === activeVotingId); }

  @Selector()
  static avg({ users, votings, activeVotingId }: Model) {
    const votes: [string, number][] = votings.find(({ id }) => id === activeVotingId)?.votes as any;
    return votes.reduce((total, [k, v]) => total + v, 0) / votes.length;
  }

  @Action(Fetch)
  fetch({ setState }: Context, { users }: Fetch) {
    setState(patch<Model>({ users: insertOrPatch((a, b) => a.id === b.id, users) }));
  }

  @Action(FetchVotings)
  fetchVotings({ setState }: Context, { votings }: FetchVotings) {
    setState(patch<Model>({
      votings: insertOrPatch<Voting<true>>((a, b) => a.id === b.id, votings)
    }));
  }

  @Action(Voted)
  voted({ setState, getState }: Context, { userId, votingId, point }: Voted) {
    setState(patch<Model>({
      users: updateItem(user => user?.id === userId, patch({ voted: true }))
    }));

    if (point !== undefined) {
      setState(patch<Model>({
        votings: updateItem(v => v?.id === votingId, patch({
          votes: insertOrPatch((a) => !!a && a[0] === userId, [[userId, point]], true)
        }))
      }));
    }
  }

  @Action(Unvoted)
  unvoted({ setState }: Context, { userId, votingId }: Unvoted) {
    setState(patch<Model>({
      users: updateItem(user => user?.id === userId, patch({ voted: false })),
      votings: updateItem(v => v?.id === votingId, patch({
        votes: removeItem<Voting<true>['votes'][number]>(a => !!a && a[0] === userId)
      }))
    }));
  }

  @Action(Flip)
  flip({ setState, getState }: Context, { voting }: Flip) {
    setState(patch<Model>({
      votings: updateItem(v => v?.id === voting.id, patch(voting))
    }));
  }

  @Action(StartVoting)
  startVoting({ setState }: Context, { votingId }: StartVoting) {
    setState(patch<Model>({
      users: updateItem(u => true, patch({ voted: false })),
      votings: updateItem(voting => voting?.id === votingId, patch({
        status: "in-progress"
      }))
    }));
  }
  @Action(EndVoting)
  endVoting({ setState }: Context, { votingId }: EndVoting) {
    setState(patch<Model>({
      users: mapItems(u => ({ ...u, voted: false })),
      activeVotingId: undefined,
      votings: updateItem(voting => voting?.id === votingId, patch({
        status: "end"
      }))
    }));
  }

  @Action(ActivateVoting)
  activateVoting({ setState, getState }: Context, { votingId }: ActivateVoting) {
    if(['pristine', 'in-progress'].includes(getState().votings.find(v => v.id === getState().activeVotingId)?.status || "")) {
      setState(patch<Model>({
        votings: updateItem(item => item?.id === getState().activeVotingId, patch({
          votes: [] as Voting<true>['votes']
        }))
      }));
    }
    setState(patch<Model>({
      users: mapItems(u => ({ ...u, voted: false })),
      activeVotingId: votingId,
    }));
  }
}
