import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomVotingsEditComponent } from './room-votings-edit.component';

describe('RoomVotingsEditComponent', () => {
  let component: RoomVotingsEditComponent;
  let fixture: ComponentFixture<RoomVotingsEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RoomVotingsEditComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RoomVotingsEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
