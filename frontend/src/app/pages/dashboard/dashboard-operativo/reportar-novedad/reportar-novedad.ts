import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { InventarioService } from '../../../../services/inventario/inventario-service';
import { AlertaService } from '../../../../services/alerta/alerta-service';
import { AuthService } from '../../../../services/auth/auth-service';
import { UnidadRecurso } from '../../../../models/unidad-recurso.models';
import { Alerta, TIPOS_NOVEDAD } from '../../../../models/alerta.models';

function extraerMensajes(valor: unknown): string[] {
    if (typeof valor === 'string') return [valor];
    if (Array.isArray(valor)) return valor.flatMap((v) => extraerMensajes(v));
    if (valor && typeof valor === 'object') {
        return Object.values(valor).flatMap((v) => extraerMensajes(v));
    }
    return [];
}

@Component({
    imports: [ReactiveFormsModule, DatePipe],
    selector: 'app-reportar-novedad',
    styleUrl: './reportar-novedad.css',
    templateUrl: './reportar-novedad.html',
})
export class ReportarNovedad implements OnInit {
    unidades: UnidadRecurso[] = [];
    misAlertas: Alerta[] = [];
    tipos = TIPOS_NOVEDAD;

    mensajeExito = '';
    erroresServidor: string[] = [];
    enviando = false;

    readonly alertaClases: Record<string, string> = {
        Pendiente: 'bg-warning text-dark',
        Atendida: 'bg-success',
    };

    private fb = inject(FormBuilder);
    private ruta = inject(ActivatedRoute);
    private inventarioService = inject(InventarioService);
    private alertaService = inject(AlertaService);
    private authService = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);

    formularioNovedad: FormGroup = this.fb.group({
        unidad: ['', Validators.required],
        tipo: ['', Validators.required],
        descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
    });

    ngOnInit(): void {
        const usuario = this.authService.obtenerUsuarioActual();
        if (!usuario) {
            this.erroresServidor = ['No hay un usuario con sesión iniciada.'];
            return;
        }

        this.inventarioService.obtenerUnidades({ idUsuarioAsignado: usuario.idUsuario }).subscribe({
            next: (unidades) => {
                this.unidades = unidades;
                // Si vino desde "Mis recursos", la unidad queda preseleccionada
                const preseleccion = Number(this.ruta.snapshot.queryParamMap.get('unidad'));
                if (unidades.some((u) => u.idUnidadRecurso === preseleccion)) {
                    this.Unidad?.setValue(preseleccion);
                }
                this.cdr.detectChanges();
            },
            error: (e) => {
                console.error('Error al cargar tus unidades:', e);
                this.erroresServidor = ['No se pudieron cargar tus recursos.'];
                this.cdr.detectChanges();
            },
        });

        this.cargarMisAlertas();
    }

    private cargarMisAlertas(): void {
        const usuario = this.authService.obtenerUsuarioActual();
        if (!usuario) return;

        this.alertaService.obtenerAlertas({ idUsuarioReporta: usuario.idUsuario }).subscribe({
            next: (alertas) => {
                this.misAlertas = alertas;
                this.cdr.detectChanges();
            },
            error: (e) => console.error('Error al cargar tus reportes:', e),
        });
    }

    reportarNovedad(): void {
        if (this.formularioNovedad.invalid) {
            this.formularioNovedad.markAllAsTouched();
            return;
        }
        const usuario = this.authService.obtenerUsuarioActual();
        if (!usuario) {
            this.erroresServidor = ['No hay un usuario con sesión iniciada.'];
            return;
        }

        this.mensajeExito = '';
        this.erroresServidor = [];
        this.enviando = true;

        this.alertaService
            .registrarNovedad({
                idUnidadRecurso: this.Unidad?.value,
                idUsuarioReporta: usuario.idUsuario,
                tipo: this.Tipo?.value,
                descripcion: String(this.Descripcion?.value).trim(),
            })
            .subscribe({
                next: (respuesta) => {
                    this.mensajeExito = respuesta.mensaje;
                    this.formularioNovedad.reset({ unidad: '', tipo: '', descripcion: '' });
                    this.enviando = false;
                    this.cargarMisAlertas();
                    this.cdr.detectChanges();
                },
                error: (error: HttpErrorResponse | Error) => {
                    this.erroresServidor =
                        error instanceof HttpErrorResponse
                            ? extraerMensajes(error.error)
                            : [error.message];
                    this.enviando = false;
                    this.cdr.detectChanges();
                },
            });
    }

    get Unidad() { return this.formularioNovedad.get('unidad'); }
    get Tipo() { return this.formularioNovedad.get('tipo'); }
    get Descripcion() { return this.formularioNovedad.get('descripcion'); }
}
