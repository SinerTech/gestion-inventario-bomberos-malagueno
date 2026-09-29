import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pagina404 } from './pagina-404';

describe('Pagina404', () => {
  let component: Pagina404;
  let fixture: ComponentFixture<Pagina404>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pagina404],
    }).compileComponents();

    fixture = TestBed.createComponent(Pagina404);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
