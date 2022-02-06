import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AuthService } from "./components/auth/auth.service";
import { WsService } from "./services/ws.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  showHistory: boolean = (window.localStorage.getItem('showHistory') || 'true') === 'true';
  showPlayers: boolean = (window.localStorage.getItem('showPlayers') || 'true') === 'true';
  avg: number = 0;
  votedCount: number = 0;

  constructor(public authService: AuthService, public ws: WsService) {}

  toggleHistory() {
    this.showHistory = !this.showHistory;
    window.localStorage.setItem('showHistory', this.showHistory.toString());
  }

  togglePlayers() {
    this.showPlayers = !this.showPlayers;
    window.localStorage.setItem('showPlayers', this.showPlayers.toString());
  }

  ngOnInit() {
  }
}
