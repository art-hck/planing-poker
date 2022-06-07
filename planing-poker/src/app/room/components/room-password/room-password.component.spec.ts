import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomPasswordComponent } from './room-password.component';

describe('RoomPasswordComponent', () => {
  let component: RoomPasswordComponent;
  let fixture: ComponentFixture<RoomPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RoomPasswordComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RoomPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should password', () => {
    expect(component).toBeTruthy();
  });
});
