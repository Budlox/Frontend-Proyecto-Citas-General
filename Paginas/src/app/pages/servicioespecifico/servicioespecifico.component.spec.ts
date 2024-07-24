import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicioespecificoComponent } from './servicioespecifico.component';

describe('ServicioespecificoComponent', () => {
  let component: ServicioespecificoComponent;
  let fixture: ComponentFixture<ServicioespecificoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicioespecificoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServicioespecificoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
