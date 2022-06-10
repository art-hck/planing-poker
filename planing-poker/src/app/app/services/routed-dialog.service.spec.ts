import { TestBed } from '@angular/core/testing';

import { RoutedDialog } from './routed-dialog.service';

describe('RoutedDialog', () => {
  let service: RoutedDialog;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RoutedDialog);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
