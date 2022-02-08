import { Uuid } from "./uuid";

export interface Voting<serialized = false> {
  id: Uuid;
  name: string;
  votes: serialized extends false ? Map<string, number> : [string, number][];
  status: "end" | "pristine" | "in-progress";
}
