import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { filter, Subject, takeUntil } from 'rxjs';
import { PlaningPokerWsService } from '../../../app/services/planing-poker-ws.service';
import { TitleService } from '../../../app/services/title.service';
import { RoomCreateComponent } from '../room-create/room-create.component';

@Component({
  selector: 'pp-rooms-home',
  templateUrl: './rooms-home.component.html',
  styleUrls: ['./rooms-home.component.scss']
})
export class RoomsHomeComponent implements OnDestroy {
  readonly destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    public pp: PlaningPokerWsService,
    public title: Title,
    public titleService: TitleService
  ) {
    this.titleService.reset();
    this.title.setTitle('Список комнат - PlaningPoker');
  }

  newRoom() {
    this.dialog.open(RoomCreateComponent, { width: '500px', panelClass: 'app-responsive-modal' }).afterClosed()
      .pipe(filter(v => !!v), takeUntil(this.destroy$))
      .subscribe(r => r.name ? this.pp.newRoom(r.name, r.points, r.canPreviewVotes, r.alias, r.password) : null);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
