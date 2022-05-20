import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LimitSnackbarComponent } from './limit-snackbar.component';

describe('LimitSnackbarComponent', () => {
  let component: LimitSnackbarComponent;
  let fixture: ComponentFixture<LimitSnackbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LimitSnackbarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LimitSnackbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
