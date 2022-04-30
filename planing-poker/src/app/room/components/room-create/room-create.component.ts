import { Component, OnDestroy } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialogRef } from '@angular/material/dialog';
import { RoomRole } from '@common/models';
import { startWith, Subject, takeUntil } from 'rxjs';

type RoomRoleData = { role: RoomRole, name: string, checked: boolean }

@Component({
  selector: 'pp-room-create',
  templateUrl: './room-create.component.html',
  styleUrls: ['./room-create.component.scss']
})
export class RoomCreateComponent implements OnDestroy {

  readonly form = this.fb.group({
    name: ['', Validators.required],
    points: this.fb.array(['0', '0.5', '1', '2', '3', '5', '8', '13', '20', '40']),
    canPreviewVotes: []
  });
  readonly roomRoles = this.fb.array([
    this.fb.group({ role: RoomRole.admin, name: 'Модератор', checked: true }),
    this.fb.group({ role: RoomRole.observer, name: 'Наблюдатели', checked: true }),
    this.fb.group({ role: RoomRole.user, name: 'Голосующие', checked: false })
  ]);
  readonly asFormGroup = (c: AbstractControl) => c as FormGroup;
  readonly destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, public matDialogRef: MatDialogRef<RoomCreateComponent>) {
    this.roomRoles.valueChanges.pipe(startWith(this.roomRoles.value), takeUntil(this.destroy$)).subscribe((value: RoomRoleData[]) => {
      this.form.get('canPreviewVotes')?.setValue(value.filter(({ checked }) => checked).map(({ role }) => role));
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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
