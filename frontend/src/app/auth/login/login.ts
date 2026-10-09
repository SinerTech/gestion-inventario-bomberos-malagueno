import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  errorMensaje = '';
  cargando = false;

  formularioLogin = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  ingresar(): void {
    if (this.formularioLogin.invalid || this.cargando) {
      this.formularioLogin.markAllAsTouched();
      return;
    }

    const { email, password } = this.formularioLogin.getRawValue();

    if (!email || !password) {
      return;
    }

    this.errorMensaje = '';
    this.cargando = true;

    this.authService.login(email, password).subscribe({
      next: (usuario) => {
        localStorage.setItem(
          'usuario_actual',
          JSON.stringify(usuario),
        );
        this.router.navigateByUrl(
          this.authService.obtenerRutaDashboard(usuario),
        );
        this.cdr.detectChanges()
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.errorMensaje = 'Email o contraseña incorrectos.';
        } else if (err.status === 0) {
          this.errorMensaje = 'No se pudo conectar con el servidor.';
        } else {
          this.errorMensaje =
            'Ocurrió un error al iniciar sesión. Intentá nuevamente.';
        }
        this.cargando = false;
        this.cdr.detectChanges()
      },
    });
  }
}
