import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';
import { ContenidoService } from '../../services/contenido/contenido-service';
import { ImagenLanding, Valor } from '../../models/contenido.models';

@Component({
  imports: [],
  selector: 'app-home',
  styleUrl: './landing-page.css',
  templateUrl: './landing-page.html',
})
export class LandingPage implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly contenidoService = inject(ContenidoService);
  private cdr = inject(ChangeDetectorRef);

  descripcion = '';
  valores: Valor[] = [];
  imagenFondo = '';
  imagenes: ImagenLanding[] = [];
  paginaActual = 0;
  imagenesPorPagina = 3;
  paginasImagenes: ImagenLanding[][] = [];


  ngOnInit(): void {
    this.contenidoService.obtenerLanding().subscribe({
      next: (data) => {
        this.descripcion = data.descripcion;
        this.valores = data.valores;
        this.imagenFondo = data.imagen_fondo;
        this.imagenes = data.imagenes;
        this.actualizarPaginasImagenes();
        this.paginaActual = 0;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al obtener el contenido de la landing:', err);
      },
    });
  }

  comenzar(): void {
    const usuario = this.authService.obtenerUsuarioActual();

    if (!usuario) {
      this.router.navigate(['/login']);
      return;
    }

    // Reutiliza el mapeo rol -> dashboard que ya existe en AuthService
    this.router.navigate([this.authService.obtenerRutaDashboard(usuario)]);
  }

  private actualizarPaginasImagenes(): void {
    this.paginasImagenes = [];

    for (
      let i = 0;
      i < this.imagenes.length;
      i += this.imagenesPorPagina
    ) {
      this.paginasImagenes.push(
        this.imagenes.slice(i, i + this.imagenesPorPagina)
      );
    }
  }

  siguiente(): void {
    if (this.paginaActual < this.paginasImagenes.length - 1) {
      this.paginaActual++;
    }
  }

  anterior(): void {
    if (this.paginaActual > 0) {
      this.paginaActual--;
    }
  }
}
