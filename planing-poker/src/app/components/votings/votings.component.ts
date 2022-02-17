import { ChangeDetectionStrategy, Component, EventEmitter, Inject, Input, Output } from '@angular/core';
import { Voting } from "@common/models";
import { AuthService } from "../auth/auth.service";
import { PlaningPokerWsService } from "../../services/planing-poker-ws.service";
import { ActivatedRoute } from "@angular/router";
import { filter, Subject, takeUntil } from "rxjs";
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheet, MatBottomSheetRef } from "@angular/material/bottom-sheet";

@Component({
  selector: 'pp-votings',
  templateUrl: './votings.component.html',
  styleUrls: ['./votings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VotingsComponent {
  @Input() votings?: Voting<true>[] | null;
  @Output() select = new EventEmitter<Voting<true>>();
  readonly destroy$ = new Subject<void>();

  constructor(private sheet: MatBottomSheet, public authService: AuthService, private pp: PlaningPokerWsService, private route: ActivatedRoute) {
  }

  trackByFn = (index: number, item: Voting<true>) => item.id;


  deleteVoting(e: Event, voting: Voting<true>) {
    e.preventDefault();
    e.stopPropagation();
    this.sheet.open(VotingDeleteConfirmComponent, { data: { voting } }).afterDismissed().pipe(filter(v => !!v), takeUntil(this.destroy$))
      .subscribe(() => this.pp.deleteVoting(voting.id, this.route.snapshot.params['id']))
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}


@Component({
  template: `<h2 mat-dialog-title>Удалить стори <span class="app-strong">{{data.voting.name}}?</span></h2>
<div mat-dialog-actions [align]="'end'">
  <button mat-flat-button (click)="ref.dismiss(false)">Отмена</button>
  <button mat-flat-button color="primary" (click)="ref.dismiss(true)">Удалить</button>
</div>`
})
export class VotingDeleteConfirmComponent {
  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: {voting: Voting},public ref: MatBottomSheetRef) {
  }
}
