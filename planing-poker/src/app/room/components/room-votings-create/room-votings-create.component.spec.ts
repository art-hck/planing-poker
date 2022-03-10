import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomVotingsCreateComponent } from './room-votings-create.component';

describe('CreateVoteComponent', () => {
  let component: RoomVotingsCreateComponent;
  let fixture: ComponentFixture<RoomVotingsCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RoomVotingsCreateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RoomVotingsCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
