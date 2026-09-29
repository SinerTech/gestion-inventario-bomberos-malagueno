import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ControlInventario } from './control-inventario';

describe('ControlInventario', () => {
  let component: ControlInventario;
  let fixture: ComponentFixture<ControlInventario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ControlInventario],
    }).compileComponents();

    fixture = TestBed.createComponent(ControlInventario);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
