import { TestBed } from '@angular/core/testing';

import { PlaningPokerWsService } from './planing-poker-ws.service';

describe('WsActionsService', () => {
  let service: PlaningPokerWsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlaningPokerWsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
