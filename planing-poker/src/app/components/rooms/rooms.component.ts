import { ChangeDetectorRef, Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { filter, Subject, takeUntil } from "rxjs";
import { PlaningPokerWsService } from "../../services/planing-poker-ws.service";
import { MatDialog, MatDialogRef, MatDialogState } from "@angular/material/dialog";
import { MatDialogConfig } from "@angular/material/dialog/dialog-config";
import { AuthService } from "../auth/auth.service";
import { SidebarsService } from "../../services/sidebars.service";
import { FormBuilder, Validators } from "@angular/forms";
import { Uuid } from "@common/models";
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { Router } from "@angular/router";
import { ResolutionService } from "../../services/resolution.service";

@Component({
  selector: 'pp-rooms',
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.scss']
})
export class RoomsComponent {
  readonly destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private router: Router,
    public pp: PlaningPokerWsService,
    public authService: AuthService,
    public cd: ChangeDetectorRef,
    public sidebars: SidebarsService,
    public resolutionService: ResolutionService
  ) {}

  ngOnInit() {
    this.authService.user$.pipe(filter(u => !!u), takeUntil(this.destroy$)).subscribe(() => this.pp.rooms());
    this.pp.rooms$.pipe(
      filter(r => r.length === 0),
      filter(() => this.dialog.getDialogById('new_room')?.getState() !== MatDialogState.OPEN),
      takeUntil(this.destroy$)
    ).subscribe(() => this.newRoom());

    this.sidebars.detectChanges$.pipe(takeUntil(this.destroy$)).subscribe(() => this.cd.detectChanges());
    this.resolutionService.isMobile$.pipe(filter(Boolean), takeUntil(this.destroy$)).subscribe(isMobile => this.sidebars.showPlayers = isMobile);
  }

  newRoom(config: MatDialogConfig = {}) {
    this.dialog.open(NewRoomDialogComponent, { ...config, id:'new_room', width: '350px' }).afterClosed()
      .pipe(filter(v => !!v), takeUntil(this.destroy$))
      .subscribe(({ name, code }) => {
        code ? this.router.navigate([code]) : name ? this.pp.newRoom(name) : null;
      })
  }

  inviteRoom(roomId: Uuid) {
    this.dialog.open(ShareRoomDialogComponent, { width: '470px', data: { roomId } });
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
  template: `
    <h1 mat-dialog-title>Создать новую комнату</h1>
  <form [formGroup]="form" (ngSubmit)="form.valid && matDialogRef.close(form.value)">
    <div mat-dialog-content>

      <mat-form-field appearance="outline" hideRequiredMarker>
        <mat-label>Название</mat-label>
        <input matInput formControlName="name">
      </mat-form-field>
      <h4 mat-dialog-title [align]="'center'" [style.color]="'#999'">или войдите с помощью кода</h4>
      <mat-form-field appearance="outline" hideRequiredMarker>
        <mat-label>Код для входа в комнату</mat-label>
        <input matInput formControlName="code">
      </mat-form-field>

    </div>
    <div mat-dialog-actions [align]="'end'">
      <button mat-flat-button [mat-dialog-close]="false" *ngIf="!matDialogRef.disableClose">Отмена</button>
      <button mat-flat-button color="primary">Присоединиться</button>
    </div>
  </form>`
})
export class NewRoomDialogComponent {
  readonly codeValidators = [Validators.required, Validators.minLength(36), Validators.maxLength(36)];
  readonly form = this.fb.group({
    name: ['', Validators.required],
    code: ['', this.codeValidators],
  });

  constructor(private fb: FormBuilder, public matDialogRef: MatDialogRef<NewRoomDialogComponent>) {
    this.form.valueChanges.subscribe((v) => {
      this.form.get('name')?.setValidators(v.code ? null : Validators.required);
      this.form.get('code')?.setValidators(v.name ? null : this.codeValidators);
      this.form.get('code')?.updateValueAndValidity({ emitEvent: false })
      this.form.get('name')?.updateValueAndValidity({ emitEvent: false })
    })
  }
}

@Component({
  template: `
<!--      <div class="mat-body">-->
<!--        Для получения доступа к комнате достаточно просто перейти по ссылке. Скопируйте и отправте её всем участникам.-->
<!--      </div>-->
      <br/>

      <mat-form-field appearance="outline" hideRequiredMarker>
        <mat-label>Код для входа в комнату</mat-label>
        <input matInput [value]="location" #input (focus)="input.select()">
      </mat-form-field>
    <div [align]="'end'">
        <button mat-flat-button color="primary" (click)="ref.dismiss()">Закрыть</button>
    </div>
  `
})
export class ShareRoomDialogComponent {
  location = this.data.roomId;
  @ViewChild('input') input?: ElementRef<HTMLInputElement>;
  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: {roomId: Uuid}, public ref: MatBottomSheetRef) {
  }
  //
  // copy() {
  //   this.input?.nativeElement.focus();
  //   this.input?.nativeElement.select();
  //   document.execCommand('copy');
  //   this.ref.dismiss();
  // }
}
