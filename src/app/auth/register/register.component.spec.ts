import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedCardComponent } from './feed-card.component';

describe('FeedCardComponent', () => {
  let component: FeedCardComponent;
  let fixture: ComponentFixture<FeedCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FeedCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
