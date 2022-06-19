import { Component } from '@angular/core';
import { TitleService } from '../../services/title.service';

@Component({
  selector: 'pp-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss']
})
export class NotFoundComponent {
  constructor(private titleService: TitleService) {
    this.titleService.reset();
  }
}
