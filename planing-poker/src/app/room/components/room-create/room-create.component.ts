import { Component, OnDestroy, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatChipInputEvent, MatChipList } from '@angular/material/chips';
import { MatDialogRef } from '@angular/material/dialog';
import { RoomRole } from '@common/models';
import { debounceTime, distinctUntilChanged, map, of, startWith, Subject, switchMap, take, takeUntil } from 'rxjs';
import { PlaningPokerWsService } from '../../../app/services/planing-poker-ws.service';

type RoomRoleData = { role: RoomRole, name: string, checked: boolean }

@Component({
  selector: 'pp-room-create',
  templateUrl: './room-create.component.html',
  styleUrls: ['./room-create.component.scss']
})
export class RoomCreateComponent implements OnDestroy {
  @ViewChild('pointsChipList') pointsChipList!: MatChipList;
  readonly location = window?.location;
  readonly form = this.fb.group({
    name: ['', Validators.required],
    alias: ['', [
      Validators.minLength(4),
      Validators.maxLength(32),
      Validators.pattern('[a-zA-Z0-9\-]*')
    ], [
      (control: FormControl) => control.valueChanges.pipe(
        startWith(null),
        debounceTime(400),
        distinctUntilChanged(),
        switchMap(value => {
          if (!value) return of(null);
          this.pp.checkAlias(value);
          control.markAsTouched(); // Для того что б сразу вывести ошибку
          return this.pp.checkAlias$.pipe(map(({ success }) => success ? null : { alreadyInUse: true }));
        }),
        take(1)
      )
    ]],
    points: this.fb.array(
      ['0', '0.5', '1', '2', '3', '5', '8', '13', '20', '40'],
      [Validators.minLength(2), Validators.required]
    ),
    canPreviewVotes: []
  });
  readonly roomRoles = this.fb.array([
    this.fb.group({ role: RoomRole.admin, name: 'Модератор', checked: true }),
    this.fb.group({ role: RoomRole.observer, name: 'Наблюдатели', checked: true }),
    this.fb.group({ role: RoomRole.user, name: 'Голосующие', checked: false })
  ]);
  readonly asFormGroup = (c: AbstractControl) => c as FormGroup;
  readonly destroy$ = new Subject<void>();
  customize = false;

  constructor(private fb: FormBuilder, public matDialogRef: MatDialogRef<RoomCreateComponent>, private pp: PlaningPokerWsService) {
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
    this.pointsChipList.errorState = this.points.invalid;
  }

  removePoint(point: string) {
    this.points.removeAt(this.points.controls.findIndex(c => c.value === point));
    this.pointsChipList.errorState = this.points.invalid;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
