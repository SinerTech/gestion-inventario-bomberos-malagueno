import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import {
    AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule,
    ValidationErrors, Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { SetupService } from '../../services/setup/setup-service';
import { extraerMensajes } from '../../utils/errores';

function passwordsIguales(grupo: AbstractControl): ValidationErrors | null {
    return grupo.get('password')?.value === grupo.get('confirmarPassword')?.value
        ? null
        : { noCoinciden: true };
}

@Component({
    imports: [ReactiveFormsModule],
    selector: 'app-registro-inicial',
    styleUrl: './registro-inicial.css',
    templateUrl: './registro-inicial.html',
})
export class RegistroInicial implements OnInit {
    verificando = true;
    erroresServidor: string[] = [];
    mensajeExito = '';
    enviando = false;

    private fb = inject(FormBuilder);
    private setupService = inject(SetupService);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);

    formulario: FormGroup = this.fb.group(
        {
            nombre: ['', [Validators.required, Validators.maxLength(50)]],
            email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
            password: ['', [
                Validators.required,
                Validators.minLength(8),
                Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
            ]],
            confirmarPassword: ['', Validators.required],
        },
        { validators: passwordsIguales }
    );

    ngOnInit(): void {
        // Si ya hay usuarios, esta pantalla no corresponde: se redirige al login
        this.setupService.requiereSetup().subscribe({
            next: (requiere) => {
                if (!requiere) {
                    this.router.navigate(['/login']);
                    return;
                }
                this.verificando = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.erroresServidor = ['No se pudo conectar con el servidor.'];
                this.verificando = false;
                this.cdr.detectChanges();
            },
        });
    }

    registrar(): void {
        if (this.formulario.invalid) {
            this.formulario.markAllAsTouched();
            return;
        }
        this.erroresServidor = [];
        this.enviando = true;

        this.setupService.registrarAdministrador({
            nombreUsuario: this.Nombre?.value,
            emailUsuario: this.Email?.value,
            password: this.Password?.value,
        }).subscribe({
            next: (respuesta) => {
                this.mensajeExito = respuesta.mensaje;
                this.enviando = false;
                this.cdr.detectChanges();
                setTimeout(() => this.router.navigate(['/login']), 1500);
            },
            error: (error: HttpErrorResponse | Error) => {
                this.erroresServidor =
                    error instanceof HttpErrorResponse ? extraerMensajes(error.error) : [error.message];
                this.enviando = false;
                this.cdr.detectChanges();
            },
        });
    }

    get Nombre() { return this.formulario.get('nombre'); }
    get Email() { return this.formulario.get('email'); }
    get Password() { return this.formulario.get('password'); }
    get ConfirmarPassword() { return this.formulario.get('confirmarPassword'); }
}
