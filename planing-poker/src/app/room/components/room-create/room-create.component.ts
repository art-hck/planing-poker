import { Component } from '@angular/core';
import { FormArray, FormBuilder, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'pp-room-create',
  templateUrl: './room-create.component.html'
})
export class RoomCreateComponent {

  readonly codeValidators = [Validators.required, Validators.minLength(36), Validators.maxLength(36)];
  readonly form = this.fb.group({
    name: ['', Validators.required],
    code: ['', this.codeValidators],
    points: this.fb.array(['0', '0.5', '1', '2', '3', '5', '8', '13', '20', '40'])
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

  get points() {
    return (this.form.get('points') as FormArray);
  }

  addPoint(event: MatChipInputEvent) {
    const value = (event.value || '').trim();

    if (value) {
      this.points.push(this.fb.control(value));
    }

    event.chipInput?.clear();
  }

  removePoint(point: string) {
    this.points.removeAt(this.points.controls.findIndex(c => c.value === point));
  }
}
