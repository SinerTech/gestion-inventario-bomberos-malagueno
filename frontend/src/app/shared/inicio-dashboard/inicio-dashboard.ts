import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ContenidoService } from '../../services/contenido/contenido-service';
import { DashboardContenido } from '../../models/contenido.models';

@Component({
  imports: [RouterLink],
  selector: 'app-inicio-dashboard',
  styleUrl: './inicio-dashboard.css',
  templateUrl: './inicio-dashboard.html',
})
export class InicioDashboard implements OnInit {
  configuracionActual?: DashboardContenido;
  cargando = true;
  mensajeError = '';

  private contenidoService = inject(ContenidoService);
  private ruta = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    // 'administrador' | 'supervisor' | 'bombero', definido en data de cada ruta
    const tipoDashboard = this.ruta.snapshot.data['tipoDashboard'];

    this.contenidoService.obtenerDashboard(tipoDashboard).subscribe({
      next: (data) => {
        this.configuracionActual = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.mensajeError =
          'No se pudo cargar la información del dashboard. Intentá nuevamente más tarde.';
        this.cargando = false;
        console.error('Error al cargar la información del sistema', e);
        this.cdr.detectChanges();
      },
    });
  }
}
