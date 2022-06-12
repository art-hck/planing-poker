import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { merge, Subject, takeUntil } from 'rxjs';
import { DialogService } from '../../../shared/modules/dialog/dialog.service';
import { HistoryService } from '../../services/history.service';
import { PlaningPokerWsService } from '../../services/planing-poker-ws.service';
import { FeedbackComponent } from './feedback.component';

@Component({ template: '' })
export class FeedbackRouteComponent implements OnDestroy {
  private readonly destroy$ = new Subject<void>();

  constructor(private dialog: DialogService, private pp: PlaningPokerWsService, private route: ActivatedRoute, private history: HistoryService) {

    this.dialog.big(FeedbackComponent, { data: { subject: this.route.snapshot.queryParams['subject'] } })
      .pipe(takeUntil(merge(this.history.urlChanges$, this.destroy$)))
      .subscribe(r => r ? this.pp.feedback(r.subject, r.message) : this.history.back(this.route));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
