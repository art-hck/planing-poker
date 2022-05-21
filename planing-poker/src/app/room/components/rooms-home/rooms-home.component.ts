import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { PlaningPokerWsService } from '../../../app/services/planing-poker-ws.service';

@Component({
  selector: 'pp-rooms-home',
  templateUrl: './rooms-home.component.html',
  styleUrls: ['./rooms-home.component.scss']
})
export class RoomsHomeComponent {
  constructor(
    public pp: PlaningPokerWsService,
    public title: Title
  ) {
    this.title.setTitle('Список комнат - PlaningPoker');
  }
}
