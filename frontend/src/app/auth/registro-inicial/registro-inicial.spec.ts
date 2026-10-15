import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistroInicial } from './registro-inicial';

describe('RegistroInicial', () => {
  let component: RegistroInicial;
  let fixture: ComponentFixture<RegistroInicial>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroInicial],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistroInicial);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
