import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Voting } from "@common/models";
import { AuthService } from "../auth/auth.service";
import { PlaningPokerWsService } from "../../services/planing-poker-ws.service";
import { ActivatedRoute } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { filter, Subject, takeUntil } from "rxjs";

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

  constructor(private dialog: MatDialog, public authService: AuthService, private pp: PlaningPokerWsService, private route: ActivatedRoute) {
  }

  trackByFn = (index: number, item: Voting<true>) => item.id;


  deleteVoting(e: Event, voting: Voting<true>) {
    e.preventDefault();
    e.stopPropagation();
    this.dialog.open(VotingDeleteConfirmComponent).afterClosed().pipe(filter(v => !!v), takeUntil(this.destroy$))
      .subscribe(() => this.pp.deleteVoting(voting.id, this.route.snapshot.params['id']))
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}


@Component({
  template: `<h1 mat-dialog-title>Удалить стори?</h1>
<div mat-dialog-actions [align]="'end'">
  <button mat-flat-button [mat-dialog-close]="false">Отмена</button>
  <button mat-flat-button color="primary" [mat-dialog-close]="true">Удалить</button>
</div>`
})
export class VotingDeleteConfirmComponent {}
