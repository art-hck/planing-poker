import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'pp-room-create',
  templateUrl: './room-create.component.html',
})
export class RoomCreateComponent {

  readonly codeValidators = [Validators.required, Validators.minLength(36), Validators.maxLength(36)];
  readonly form = this.fb.group({
    name: ['', Validators.required],
    code: ['', this.codeValidators],
  });
  join = false;

  constructor(private fb: FormBuilder, public matDialogRef: MatDialogRef<RoomCreateComponent>) {
    this.form.valueChanges.subscribe((v) => {
      this.form.get('name')?.setValidators(v.code ? null : Validators.required);
      this.form.get('code')?.setValidators(v.name ? null : this.codeValidators);
      this.form.get('code')?.updateValueAndValidity({ emitEvent: false });
      this.form.get('name')?.updateValueAndValidity({ emitEvent: false });
    });
  }
}
