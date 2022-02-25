import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { PlaningPokerWsService } from '../../services/planing-poker-ws.service';
import { ResolutionService } from '../../services/resolution.service';
import { FeedbackComponent } from './feedback/feedback.component';
import { TelegramLinkComponent } from './telegram-link/telegram-link.component';

@Component({
  selector: 'pp-header',
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Input() showPlayers = true;
  @Input() showVotings = true;
  @Output() showPlayersChange = new EventEmitter<boolean>();
  @Output() showVotingsChange = new EventEmitter<boolean>();

  constructor(
    public authService: AuthService,
    private dialog: MatDialog,
    private pp: PlaningPokerWsService,
    public resolution: ResolutionService,
  ) {
  }

  feedback() {
    this.dialog.open(FeedbackComponent, { width: '500px' }).afterClosed().pipe(filter(v => !!v)).subscribe(({ subject, message }) => {
      this.pp.feedback(subject, message);
    });
  }

  telegramLink() {
    this.dialog.open(TelegramLinkComponent, { width: '300px' });
  }
}
