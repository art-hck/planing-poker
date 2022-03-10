import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'pp-room-delete',
  templateUrl: './room-delete.component.html'
})
export class RoomDeleteComponent {

  constructor(public ref: MatDialogRef<RoomDeleteComponent>) {
  }
}
