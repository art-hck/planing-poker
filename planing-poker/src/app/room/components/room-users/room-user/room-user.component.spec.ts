import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomUserComponent } from './room-user.component';

describe('UserComponent', () => {
  let component: RoomUserComponent;
  let fixture: ComponentFixture<RoomUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RoomUserComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RoomUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
