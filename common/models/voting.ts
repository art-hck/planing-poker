import { Uuid } from "./uuid";

export interface Voting {
  id: Uuid;
  name: string;
  votes: Map<string, number>;
  status: "end" | "pristine" | "in-progress";
}
