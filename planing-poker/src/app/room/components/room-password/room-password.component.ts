import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'pp-room-password',
  templateUrl: './room-password.component.html'
})
export class RoomPasswordComponent {
  readonly form = this.fb.group({
    password: ['', Validators.required],
  });

  constructor(private fb: FormBuilder, public matDialogRef: MatDialogRef<RoomPasswordComponent>) {}
}
