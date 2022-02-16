import { ChangeDetectorRef, Component, Inject } from '@angular/core';
import { filter, Subject, takeUntil } from "rxjs";
import { PlaningPokerWsService } from "../../services/planing-poker-ws.service";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { MatDialogConfig } from "@angular/material/dialog/dialog-config";
import { AuthService } from "../auth/auth.service";
import { SidebarsService } from "../../services/sidebars.service";
import { FormBuilder, Validators } from "@angular/forms";
import { Uuid } from "@common/models";

@Component({
  selector: 'pp-rooms',
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.scss']
})
export class RoomsComponent {
  readonly destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    public pp: PlaningPokerWsService,
    public authService: AuthService,
    public cd: ChangeDetectorRef,
    public sidebars: SidebarsService
  ) {
  }

  ngOnInit() {
    this.authService.user$.pipe(filter(u => !!u), takeUntil(this.destroy$)).subscribe(() => this.pp.rooms());
    this.pp.rooms$.pipe(filter(r => r.length === 0), takeUntil(this.destroy$)).subscribe(() => this.newRoom());
    this.sidebars.detectChanges$.pipe(takeUntil(this.destroy$)).subscribe(() => this.cd.detectChanges());
  }

  newRoom(config: MatDialogConfig = {}) {
    this.dialog.open(NewRoomDialogComponent, { ...config, width: '350px' }).afterClosed().pipe(filter(v => !!v), takeUntil(this.destroy$))
      .subscribe(({ name }) => this.pp.newRoom(name))
  }

  inviteRoom(roomId: Uuid) {
    this.dialog.open(JoinRoomDialogComponent, { width: '470px', data: { roomId } });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

@Component({
  styles: [`
    mat-form-field {
      width: 100%;
    }`],
  template: `<h1 mat-dialog-title>Создать новую комнату</h1>
  <form [formGroup]="form" (ngSubmit)="form.valid && matDialogRef.close(form.value)">
    <div mat-dialog-content>

      <mat-form-field appearance="outline" hideRequiredMarker>
        <mat-label>Название</mat-label>
        <input matInput formControlName="name">
      </mat-form-field>

    </div>
    <div mat-dialog-actions [align]="'end'">
      <button mat-flat-button [mat-dialog-close]="false" *ngIf="!matDialogRef.disableClose">Отмена</button>
      <button mat-flat-button color="primary">Создать</button>
    </div>
  </form>`
})
export class NewRoomDialogComponent {
  readonly form = this.fb.group({
    name: ['', [Validators.required]],
  });

  constructor(private fb: FormBuilder, public matDialogRef: MatDialogRef<NewRoomDialogComponent>) {
  }
}

@Component({
  styles: [`
    mat-form-field {
      width: 100%;
    }`],
  template: `<h1 mat-dialog-title>Пригласить участников</h1>
    <div mat-dialog-content>
      <div class="mat-body">
        Для получения доступа к комнате достаточно просто перейти по ссылке. Скопируйте и отправте её всем участникам.
      </div>
      <br/>

      <mat-form-field appearance="outline" hideRequiredMarker>
        <mat-label>Ссылка на комнату</mat-label>
        <input matInput [value]="location" #input (focus)="input.select()">
      </mat-form-field>

    </div>
    <div mat-dialog-actions [align]="'end'">
      <button mat-flat-button color="primary" mat-dialog-close="">Закрыть</button>
    </div>
  `
})
export class JoinRoomDialogComponent {
  location = window.location.href + this.data.roomId;
  constructor(@Inject(MAT_DIALOG_DATA) public data: {roomId: Uuid}, public matDialogRef: MatDialogRef<NewRoomDialogComponent>) {
  }
}
