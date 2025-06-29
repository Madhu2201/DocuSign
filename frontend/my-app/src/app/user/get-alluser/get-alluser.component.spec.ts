import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GetAlluserComponent } from './get-alluser.component';

describe('GetAlluserComponent', () => {
  let component: GetAlluserComponent;
  let fixture: ComponentFixture<GetAlluserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GetAlluserComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GetAlluserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
