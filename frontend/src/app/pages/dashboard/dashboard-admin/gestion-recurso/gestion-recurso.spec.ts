import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GestionRecurso } from './gestion-recurso';

describe('GestionRecurso', () => {
  let component: GestionRecurso;
  let fixture: ComponentFixture<GestionRecurso>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionRecurso],
    }).compileComponents();

    fixture = TestBed.createComponent(GestionRecurso);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
