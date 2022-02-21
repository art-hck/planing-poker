import { StateOperator } from "@ngxs/store";

export function mapItems<T>(func: (item: T) => T): StateOperator<T[]> {
  return (items: Readonly<T[]>) => {
    return items.map((item => func(item))) as T[];
  };
}
