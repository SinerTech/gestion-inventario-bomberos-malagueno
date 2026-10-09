import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportarNovedad } from './reportar-novedad';

describe('ReportarNovedad', () => {
  let component: ReportarNovedad;
  let fixture: ComponentFixture<ReportarNovedad>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportarNovedad],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportarNovedad);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
