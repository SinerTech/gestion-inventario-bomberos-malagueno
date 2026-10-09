import { Component, inject, Input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { AuthService } from '../../services/auth/auth-service';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  private readonly authService = inject(AuthService);
  private router = inject(Router)

  logoCuartel: string = 'logo/logo_bvm.png';

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
