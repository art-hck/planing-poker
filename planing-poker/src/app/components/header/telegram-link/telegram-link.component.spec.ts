import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TelegramLinkComponent } from './telegram-link.component';

describe('TelegramLinkComponent', () => {
  let component: TelegramLinkComponent;
  let fixture: ComponentFixture<TelegramLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TelegramLinkComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TelegramLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
