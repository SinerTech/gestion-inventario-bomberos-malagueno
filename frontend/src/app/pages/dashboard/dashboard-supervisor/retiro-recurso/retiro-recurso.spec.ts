import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RetiroRecurso } from './retiro-recurso';

describe('RetiroRecurso', () => {
  let component: RetiroRecurso;
  let fixture: ComponentFixture<RetiroRecurso>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RetiroRecurso],
    }).compileComponents();

    fixture = TestBed.createComponent(RetiroRecurso);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
