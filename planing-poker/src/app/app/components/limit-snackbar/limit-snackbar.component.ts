import { Component, Inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MAT_SNACK_BAR_DATA, MatSnackBar } from '@angular/material/snack-bar';
import { UserLimits } from '@common/models';
import { filter } from 'rxjs';
import { PlaningPokerWsService } from '../../services/planing-poker-ws.service';
import { FeedbackComponent } from '../feedback/feedback.component';

@Component({
  selector: 'pp-limit-snackbar',
  templateUrl: './limit-snackbar.component.html',
  styles: [`
    .limit-snackbar {
      &__footer {
        .mat-button-base+.mat-button-base {
          margin-left: 8px;
        }
      }
    }
  `]
})
export class LimitSnackbarComponent {
  constructor(
    private dialog: MatDialog,
    public snackBar: MatSnackBar,
    public pp: PlaningPokerWsService,
    @Inject(MAT_SNACK_BAR_DATA) public limits: Partial<UserLimits> | undefined
  ) {
  }


  feedback() {
    this.dialog.open(FeedbackComponent, { autoFocus: false, width: '500px', data: { subject: 'Увеличение лимитов' } })
      .afterClosed().pipe(filter(v => !!v))
      .subscribe(({ subject, message }) => this.pp.feedback(subject, message));
  }
}
