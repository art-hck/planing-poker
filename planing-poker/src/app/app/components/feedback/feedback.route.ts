import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PlaningPokerWsService } from '../../services/planing-poker-ws.service';
import { FeedbackComponent } from './feedback.component';

@Component({ template: '' })
export class FeedbackRouteComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  constructor(private dialog: MatDialog, private pp: PlaningPokerWsService, private router: Router, private route: ActivatedRoute) {
    this.dialog.open(FeedbackComponent, {
      width: '500px',
      panelClass: 'app-responsive-modal',
      backdropClass: 'app-responsive-backdrop', data: { subject: this.route.snapshot.queryParams['subject'] }
    }).afterClosed().pipe(takeUntil(this.destroy$)).subscribe(r => {
      if (r) {
        this.pp.feedback(r.subject, r.message);
      } else {
        this.router.navigate(['..'], { relativeTo: this.route });
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
