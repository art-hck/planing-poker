import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomUsersChangeModeratorComponent } from './room-users-change-moderator.component';

describe('RoomUsersChangeModeratorComponent', () => {
  let component: RoomUsersChangeModeratorComponent;
  let fixture: ComponentFixture<RoomUsersChangeModeratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RoomUsersChangeModeratorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RoomUsersChangeModeratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
