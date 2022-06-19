import { Component, Inject, OnDestroy, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatChipInputEvent, MatChipList } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Room, RoomRole } from '@common/models';
import { debounceTime, distinctUntilChanged, map, of, startWith, Subject, switchMap, take, takeUntil } from 'rxjs';
import { AuthService } from '../../../app/services/auth.service';
import { PlaningPokerWsService } from '../../../app/services/planing-poker-ws.service';

@Component({
  selector: 'pp-room-create',
  templateUrl: './room-create.component.html',
  styleUrls: ['./room-create.component.scss']
})
export class RoomCreateComponent implements OnDestroy {
  @ViewChild('pointsChipList') pointsChipList!: MatChipList;
  readonly location = location?.origin;
  readonly presets = [
    { name: 'Scrum', values: ['0', '0.5', '1', '2', '3', '5', '8', '13', '20', '40'] },
    { name: 'Fibonacci', values: ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?', '☕'] },
    // { name: 'Sequential', values: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '?', '☕'] },
    { name: 'T-Shirt', values: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?', '☕'] }
  ];
  readonly form = this.fb.group({
    name: ['', Validators.required],
    password: [''],
    alias: ['', [
      Validators.minLength(4),
      Validators.maxLength(32),
      Validators.pattern('[a-zA-Z0-9\-]*')
    ], [
      control => control.valueChanges.pipe(
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
      this.presets[0].values,
      [Validators.minLength(2), Validators.required]
    ),
    canPreviewVotes: [[RoomRole.admin, RoomRole.observer]]
  });
  readonly roomRoles = this.fb.array([
    this.fb.group({ role: RoomRole.admin, name: 'Модератор', checked: false }),
    this.fb.group({ role: RoomRole.observer, name: 'Наблюдатели', checked: false }),
    this.fb.group({ role: RoomRole.user, name: 'Голосующие', checked: false })
  ]);
  readonly asFormGroup = (c: AbstractControl) => c as FormGroup;
  readonly destroy$ = new Subject<void>();

  customize = !!this.data?.room;

  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: { room: Room<true> },
    public matDialogRef: MatDialogRef<RoomCreateComponent>,
    public authService: AuthService,
    private pp: PlaningPokerWsService
  ) {
    if (data?.room) { // Если редактируем комнату, а не создаём новую, проставляем начальные значения в форму
      this.form.patchValue(data.room, { emitEvent: false });
      this.points.clear({ emitEvent: false });
      this.setPoints(data.room.points);
    }

    // Если меняем чекбокс в roomRoles, то синхронизируем роли в основной форме
    this.roomRoles.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.form.get('canPreviewVotes')?.setValue(value.filter(({ checked }) => checked).map(({ role }) => role as RoomRole));
    });
    // Проставляем изначальные значения из формы в чекбоксы
    this.roomRoles.controls.forEach(c => {
      c.get('checked')?.setValue(!!c.value.role && !!this.form.value.canPreviewVotes?.includes(c.value.role), { emitEvent: false });
    });
  }

  get points() {
    return (this.form.get('points') as FormArray);
  }

  setPoints(points: string[]) {
    this.points.clear({ emitEvent: false });
    points.map(p => this.fb.control(p)).forEach(c => this.points.push(c, { emitEvent: false }));
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
