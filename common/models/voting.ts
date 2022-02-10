import { Uuid } from "./uuid";

export interface Voting<serialized = false> {
  id: Uuid;
  name: string;
  votes: Votes<serialized>;
  status: "end" | "pristine" | "in-progress";
}

export type Votes<serialized = false> = serialized extends false ? Map<Uuid, number | null> : [Uuid, number | null][];
