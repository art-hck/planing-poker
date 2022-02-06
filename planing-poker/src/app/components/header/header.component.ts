import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AuthService } from "../auth/auth.service";

@Component({
  selector: 'pp-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  @Output() menu = new EventEmitter();
  @Output() history = new EventEmitter();
  @Input() showHistory = true;

  constructor(public authService: AuthService) {}

}
