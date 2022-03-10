import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomVotingsComponent } from './room-votings.component';

describe('VotingsComponent', () => {
  let component: RoomVotingsComponent;
  let fixture: ComponentFixture<RoomVotingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RoomVotingsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RoomVotingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
