import { ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../services/auth/auth-service';
import { SetupService } from '../../services/setup/setup-service';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly setupService = inject(SetupService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  logoCuartel: string = 'logo/logo_bvm.webp';
  requiereSetup = false;
  private suscripcionRutas?: Subscription;

  ngOnInit(): void {
    this.consultarSetup();

    // Cada vez que se termina de navegar, se vuelve a consultar.
    // Es una sola petición: SetupService la cachea hasta que se crea el administrador.
    this.suscripcionRutas = this.router.events
      .pipe(filter((evento) => evento instanceof NavigationEnd))
      .subscribe(() => this.consultarSetup());
  }

  ngOnDestroy(): void {
    this.suscripcionRutas?.unsubscribe();
  }

  private consultarSetup(): void {
    // Si ya se sabe que no hace falta, no se consulta más
    if (!this.requiereSetup && this.yaConsultado) return;

    this.setupService.requiereSetup().subscribe({
      next: (requiere) => {
        this.requiereSetup = requiere;
        this.yaConsultado = true;
        this.cdr.detectChanges();
      },
      error: () => { /* si falla, se muestra el botón de login normal */ },
    });
  }

  private yaConsultado = false;

  get estaAutenticado(): boolean {
    return this.authService.estaLogueado();
  }

  cerrarSesion(): void {
    localStorage.removeItem('usuario_actual');
    this.router.navigate(['/bomberos-malagueno/landing-page']);
  }

  get esDashboard(): boolean {
    return this.router.url.includes('dashboard');
  }
}