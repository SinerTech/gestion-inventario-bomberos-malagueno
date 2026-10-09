import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MisRecursos } from './mis-recursos';

describe('MisRecursos', () => {
  let component: MisRecursos;
  let fixture: ComponentFixture<MisRecursos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisRecursos],
    }).compileComponents();

    fixture = TestBed.createComponent(MisRecursos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
