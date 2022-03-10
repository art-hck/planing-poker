import { TestBed } from '@angular/core/testing';

import { SidebarsService } from './sidebars.service';

describe('SidebarsService', () => {
  let service: SidebarsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SidebarsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
