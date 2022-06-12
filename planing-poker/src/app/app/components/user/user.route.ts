import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, switchMap, takeUntil } from 'rxjs';
import { DialogService } from '../../../shared/modules/dialog/dialog.service';
import { AuthService } from '../../services/auth.service';
import { PlaningPokerWsService } from '../../services/planing-poker-ws.service';
import { UserComponent } from './user.component';

@Component({ template: '' })
export class UserRouteComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private dialog: DialogService,
    private pp: PlaningPokerWsService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.authService.user$.pipe(
      switchMap(user => {
        return this.dialog.small(UserComponent, { data: { user }, autoFocus: false });
      }),
      takeUntil(this.destroy$)
    ).subscribe(payload => {
      if (payload) {
        const { name, role } = payload;
        this.pp.editUser(name, role);
      }
      this.router.navigate(['..'], { relativeTo: this.route, replaceUrl: true });
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
