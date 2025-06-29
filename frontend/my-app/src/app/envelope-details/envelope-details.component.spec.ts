import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnvelopeDetailsComponent } from './envelope-details.component';

describe('EnvelopeDetailsComponent', () => {
  let component: EnvelopeDetailsComponent;
  let fixture: ComponentFixture<EnvelopeDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnvelopeDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnvelopeDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
