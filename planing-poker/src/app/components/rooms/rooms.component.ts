import { Component } from '@angular/core';
import { filter, Subject, takeUntil } from "rxjs";
import { PlaningPokerWsService } from "../../services/planing-poker-ws.service";
import { MatDialog } from "@angular/material/dialog";
import { MatDialogConfig } from "@angular/material/dialog/dialog-config";
import { AuthService } from "../auth/auth.service";

@Component({
  selector: 'pp-rooms',
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.scss']
})
export class RoomsComponent {
  readonly destroy$ = new Subject<void>();

  constructor(private dialog: MatDialog, public pp: PlaningPokerWsService, public authService: AuthService) {}

  ngOnInit() {
    this.authService.user$.pipe(filter(u => !!u), takeUntil(this.destroy$)).subscribe(() => this.pp.rooms());
    this.pp.rooms$.pipe(filter(r => r.length === 0), takeUntil(this.destroy$)).subscribe(() => this.newRoom({ disableClose: true }));
  }

  newRoom(config: MatDialogConfig = {}) {
    this.dialog.open(NewRoomDialogComponent, { ...config, width: '350px' }).afterClosed().pipe(filter(v => !!v), takeUntil(this.destroy$))
      .subscribe(() => this.pp.newRoom())
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

@Component({
  template: `<h1 mat-dialog-title>Создать новую комнату</h1>
  <div mat-dialog-content>Для проведения голосований необходимо создать новую комнату, или подключиться к существующей по ссылке</div>
  <div mat-dialog-actions [align]="'end'">
    <button mat-flat-button color="primary" [mat-dialog-close]="true">Создать</button>
  </div>`
})
export class NewRoomDialogComponent {}
