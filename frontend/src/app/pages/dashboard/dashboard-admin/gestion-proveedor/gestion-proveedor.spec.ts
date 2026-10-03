import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GestionProveedor } from './gestion-proveedor';

describe('GestionProveedor', () => {
  let component: GestionProveedor;
  let fixture: ComponentFixture<GestionProveedor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionProveedor],
    }).compileComponents();

    fixture = TestBed.createComponent(GestionProveedor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
