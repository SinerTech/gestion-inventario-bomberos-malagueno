import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GestionAlerta } from './gestion-alerta';

describe('GestionAlerta', () => {
  let component: GestionAlerta;
  let fixture: ComponentFixture<GestionAlerta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionAlerta],
    }).compileComponents();

    fixture = TestBed.createComponent(GestionAlerta);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
