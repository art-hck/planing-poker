import { Pipe, PipeTransform } from '@angular/core';
import { Role, User } from "@common/models";

@Pipe({
  name: 'users'
})
export class UsersPipe implements PipeTransform {

  transform(users: User[] | null, roles: Role[], allowAnonymous = false): User[] {
    // return users?.filter(({role}) => roles.includes(role)) || [];
    return users?.filter(({ teamRole }) => roles.includes(teamRole) || teamRole.length === 0 && allowAnonymous).sort() || [];
  }

}
