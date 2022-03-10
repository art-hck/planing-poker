import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomVotingsDeleteComponent } from './room-votings-delete.component';

describe('RoomVotingsDeleteComponent', () => {
  let component: RoomVotingsDeleteComponent;
  let fixture: ComponentFixture<RoomVotingsDeleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RoomVotingsDeleteComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RoomVotingsDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
