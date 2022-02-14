import { Component } from '@angular/core';
import { filter, Subject, takeUntil } from "rxjs";
import { PlaningPokerWsService } from "../../services/planing-poker-ws.service";
import { MatDialog } from "@angular/material/dialog";

@Component({
  selector: 'pp-rooms',
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.scss']
})
export class RoomsComponent {
  readonly destroy$ = new Subject<void>();
  readonly rooms$ = this.pp.rooms$;

  constructor(private dialog: MatDialog, private pp: PlaningPokerWsService) {
  }

  ngOnInit() {
    this.pp.rooms();
    this.rooms$.pipe(filter(r => r.length === 0)).subscribe(() => this.newRoom());
  }

  newRoom() {
    this.dialog.open(NewRoomDialogComponent, { width: '350px', disableClose: true }).afterClosed().pipe(filter(v => !!v), takeUntil(this.destroy$))
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
