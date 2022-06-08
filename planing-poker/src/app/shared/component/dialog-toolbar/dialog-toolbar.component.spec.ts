import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogToolbarComponent } from './dialog-toolbar.component';

describe('DialogToolbarComponent', () => {
  let component: DialogToolbarComponent;
  let fixture: ComponentFixture<DialogToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogToolbarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
