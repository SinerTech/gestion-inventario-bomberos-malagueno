import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DevolucionRecurso } from './devolucion-recurso';

describe('DevolucionRecurso', () => {
  let component: DevolucionRecurso;
  let fixture: ComponentFixture<DevolucionRecurso>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DevolucionRecurso],
    }).compileComponents();

    fixture = TestBed.createComponent(DevolucionRecurso);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
