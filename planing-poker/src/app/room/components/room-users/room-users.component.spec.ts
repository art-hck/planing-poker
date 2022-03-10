import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomUsersComponent } from './room-users.component';

describe('UsersComponent', () => {
  let component: RoomUsersComponent;
  let fixture: ComponentFixture<RoomUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RoomUsersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RoomUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
