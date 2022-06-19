import { Component } from '@angular/core';
import { TitleService } from '../../services/title.service';

@Component({
  selector: 'pp-forbidden',
  templateUrl: './forbidden.component.html',
  styleUrls: ['../not-found/not-found.component.scss'],
})
export class ForbiddenComponent {
  constructor(private titleService: TitleService) {
    this.titleService.reset();
  }
}
