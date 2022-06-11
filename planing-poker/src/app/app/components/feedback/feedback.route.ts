import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DefaultDialogConfig } from '../../../shared/util/default-dialog-config';
import { HistoryService } from '../../services/history.service';
import { PlaningPokerWsService } from '../../services/planing-poker-ws.service';
import { FeedbackComponent } from './feedback.component';

@Component({ template: '' })
export class FeedbackRouteComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  constructor(private dialog: MatDialog, private pp: PlaningPokerWsService, private route: ActivatedRoute, private history: HistoryService) {
    this.dialog.open(FeedbackComponent, { ...DefaultDialogConfig, data: { subject: this.route.snapshot.queryParams['subject'] } }).afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(r => r ? this.pp.feedback(r.subject, r.message) : this.history.back(this.route));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
