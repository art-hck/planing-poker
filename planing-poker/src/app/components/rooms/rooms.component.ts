import { ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatDialog, MatDialogState } from '@angular/material/dialog';
import { MatDialogConfig } from '@angular/material/dialog/dialog-config';
import { Router } from '@angular/router';
import { Uuid } from '@common/models';
import { filter, Subject, takeUntil } from 'rxjs';
import { PlaningPokerWsService } from '../../services/planing-poker-ws.service';
import { ResolutionService } from '../../services/resolution.service';
import { SidebarsService } from '../../services/sidebars.service';
import { AuthService } from '../../services/auth.service';
import { RoomCreateComponent } from './room-create/room-create.component';

@Component({
  selector: 'pp-rooms',
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.scss'],
})
export class RoomsComponent implements OnInit, OnDestroy {
  readonly destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private router: Router,
    public pp: PlaningPokerWsService,
    public authService: AuthService,
    public cd: ChangeDetectorRef,
    public sidebars: SidebarsService,
    public resolutionService: ResolutionService,
  ) {
  }

  ngOnInit() {
    this.authService.user$.pipe(filter(u => !!u), takeUntil(this.destroy$)).subscribe(() => this.pp.rooms());
    this.pp.rooms$.pipe(
      filter(r => r.length === 0),
      filter(() => this.dialog.getDialogById('new_room')?.getState() !== MatDialogState.OPEN),
      takeUntil(this.destroy$),
    ).subscribe(() => this.newRoom());

    this.sidebars.detectChanges$.pipe(takeUntil(this.destroy$)).subscribe(() => this.cd.detectChanges());
    this.resolutionService.isMobile$.pipe(filter(Boolean), takeUntil(this.destroy$)).subscribe(isMobile => this.sidebars.showPlayers = isMobile);
  }

  newRoom(config: MatDialogConfig = {}) {
    this.dialog.open(RoomCreateComponent, { ...config, id: 'new_room', width: '360px' }).afterClosed()
      .pipe(filter(v => !!v), takeUntil(this.destroy$))
      .subscribe(({ name, code }) => {
        code ? this.router.navigate([code]) : name ? this.pp.newRoom(name) : null;
      });
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
  template: `
    <!--      <div class="mat-body">-->
    <!--        Для получения доступа к комнате достаточно просто перейти по ссылке. Скопируйте и отправте её всем участникам.-->
    <!--      </div>-->
    <br />

    <mat-form-field appearance='outline' hideRequiredMarker>
      <mat-label>Код для входа в комнату</mat-label>
      <input matInput [value]='location' #input (focus)='input.select()'>
    </mat-form-field>
    <div [align]="'end'">
      <button mat-flat-button color='primary' (click)='ref.dismiss()'>Закрыть</button>
    </div>
  `,
})
export class ShareRoomDialogComponent {
  location = this.data.roomId;
  @ViewChild('input') input?: ElementRef<HTMLInputElement>;

  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: { roomId: Uuid }, public ref: MatBottomSheetRef) {
  }

  //
  // copy() {
  //   this.input?.nativeElement.focus();
  //   this.input?.nativeElement.select();
  //   document.execCommand('copy');
  //   this.ref.dismiss();
  // }
}
