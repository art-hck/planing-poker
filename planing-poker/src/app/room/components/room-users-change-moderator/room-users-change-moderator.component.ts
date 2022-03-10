import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'pp-room-users-change-moderator',
  templateUrl: './room-users-change-moderator.component.html'
})
export class RoomUsersChangeModeratorComponent {
  constructor(public ref: MatDialogRef<RoomUsersChangeModeratorComponent>) {
  }
}
