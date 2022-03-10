import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogConfig } from '@angular/material/dialog/dialog-config';
import { Router } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../app/services/auth.service';
import { PlaningPokerWsService } from '../../../app/services/planing-poker-ws.service';
import { ResolutionService } from '../../../app/services/resolution.service';
import { SidebarsService } from '../../../app/services/sidebars.service';
import { RoomCreateComponent } from '../room-create/room-create.component';

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
    public resolutionService: ResolutionService
  ) {
  }

  ngOnInit() {
    this.authService.user$.pipe(filter(u => !!u), takeUntil(this.destroy$)).subscribe(() => this.pp.rooms());
  }

  newRoom(config: MatDialogConfig = {}) {
    this.dialog.open(RoomCreateComponent, { ...config, id: 'new_room', width: '360px' }).afterClosed()
      .pipe(filter(v => !!v), takeUntil(this.destroy$))
      .subscribe(({ name, code }) => {
        code ? this.router.navigate(['room', code]) : name ? this.pp.newRoom(name) : null;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
