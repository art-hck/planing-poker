import { Pipe, PipeTransform } from '@angular/core';
import { Room, RoomRole, User } from '@common/models';

@Pipe({
  name: 'roomUsers',
})
export class RoomUsersPipe implements PipeTransform {

  transform(users: User[], room: Room<true>, roles: RoomRole[]): User[] {
    return users.filter((u) => roles.every(role => room.users.find(([id]) => u.id === id)?.[1].includes(role))).sort() || [];
  }
}
