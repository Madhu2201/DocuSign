import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnvelopecreateComponent } from './envelopecreate.component';

describe('EnvelopecreateComponent', () => {
  let component: EnvelopecreateComponent;
  let fixture: ComponentFixture<EnvelopecreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnvelopecreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnvelopecreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
