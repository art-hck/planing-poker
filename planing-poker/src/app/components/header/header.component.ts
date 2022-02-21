import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { AuthService } from "../auth/auth.service";
import { MatDialog } from "@angular/material/dialog";
import { FeedbackComponent } from "../feedback/feedback.component";
import { filter } from "rxjs";
import { PlaningPokerWsService } from "../../services/planing-poker-ws.service";
import { ResolutionService } from "../../services/resolution.service";

@Component({
  selector: 'pp-header',
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  @Input() showPlayers = true;
  @Input() showVotings = true;
  @Output() showPlayersChange = new EventEmitter<boolean>();
  @Output() showVotingsChange = new EventEmitter<boolean>();
  showButtons = false;

  ngOnInit() {
    this.resolutionService.isMobile$.subscribe(isMobile => {
      this.showButtons = isMobile;
      this.cd.detectChanges();
    })
  }

  constructor(
    public authService: AuthService,
    private dialog: MatDialog,
    private pp: PlaningPokerWsService,
    private resolutionService: ResolutionService,
    private cd: ChangeDetectorRef
  ) {}

  feedback() {
    this.dialog.open(FeedbackComponent, {width: '500px'}).afterClosed().pipe(filter(v => !!v)).subscribe(({subject, message}) => {
      this.pp.feedback(subject, message);
    });
  }
}
