import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendersignDocComponent } from './sendersign-doc.component';

describe('SendersignDocComponent', () => {
  let component: SendersignDocComponent;
  let fixture: ComponentFixture<SendersignDocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SendersignDocComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SendersignDocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
