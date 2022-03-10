import { StateOperator } from '@ngxs/store';
import { insertItem, patch, updateItem } from '@ngxs/store/operators';
import { RepairType } from '@ngxs/store/operators/utils';

export function insertOrPatch<T>(searchFn: (a: T, b: T) => boolean, arr: T[], keepOld = false): StateOperator<T[]> {
  return (arrState: Readonly<T[]>) => {
    return arr.reduce((acc: T[], curr) => {
        const i = acc.findIndex((item) => searchFn(item, curr));
        if (i !== -1) {
          return updateItem<T>(u => searchFn(u as T, curr), patch(curr))(acc as RepairType<T>[]) as T[];
        } else {
          return insertItem<T>(curr)(acc as RepairType<T>[]) as T[];
        }
      },
      arrState.filter(userState => arr.some(user => keepOld || searchFn(userState, user))), // фильтруем (удаляем то чего нет в новом массиве)
    );
  };
}
