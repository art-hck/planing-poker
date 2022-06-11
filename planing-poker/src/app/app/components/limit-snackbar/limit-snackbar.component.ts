import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { UserLimits } from '@common/models';
import { activatedRouteFirstChild } from '../../../shared/util/activated-route-first-child';
import { PlaningPokerWsService } from '../../services/planing-poker-ws.service';

@Component({
  selector: 'pp-limit-snackbar',
  templateUrl: './limit-snackbar.component.html',
  styles: [`
    .limit-snackbar {
      &__footer {
        .mat-button-base + .mat-button-base {
          margin-left: 8px;
        }
      }
    }
  `]
})
export class LimitSnackbarComponent {
  readonly activatedRouteFirstChild = activatedRouteFirstChild;

  constructor(
    public snackBar: MatSnackBar,
    public router: Router,
    public route: ActivatedRoute,
    public pp: PlaningPokerWsService,
    @Inject(MAT_SNACK_BAR_DATA) public limits: Partial<UserLimits> | undefined
  ) {}
}
