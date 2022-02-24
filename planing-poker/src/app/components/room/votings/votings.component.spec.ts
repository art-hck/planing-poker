import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VotingsComponent } from './votings.component';

describe('VotingsComponent', () => {
  let component: VotingsComponent;
  let fixture: ComponentFixture<VotingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VotingsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VotingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
