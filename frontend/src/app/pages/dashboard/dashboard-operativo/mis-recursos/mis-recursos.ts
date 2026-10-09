import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { InventarioService } from '../../../../services/inventario/inventario-service';
import { AlertaService } from '../../../../services/alerta/alerta-service';
import { AuthService } from '../../../../services/auth/auth-service';
import { UnidadRecurso } from '../../../../models/unidad-recurso.models';

@Component({
    imports: [DatePipe, RouterLink],
    selector: 'app-mis-recursos',
    styleUrl: './mis-recursos.css',
    templateUrl: './mis-recursos.html',
})
export class MisRecursos implements OnInit {
    nombreUsuario = '';
    unidades: UnidadRecurso[] = [];
    idsConNovedad = new Set<number>(); // unidades con una novedad pendiente mía
    cargando = true;
    mensajeError = '';

    readonly estadoClases: Record<string, string> = {
        'Op-Bueno': 'bg-success',
        'Op-Regular': 'bg-warning text-dark',
        'Op-Malo': 'bg-danger',
        'NoOp-Bueno': 'bg-secondary',
        'NoOp-Regular': 'bg-secondary',
        'NoOp-Malo': 'bg-dark',
    };

    private inventarioService = inject(InventarioService);
    private alertaService = inject(AlertaService);
    private authService = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);

    ngOnInit(): void {
        const usuario = this.authService.obtenerUsuarioActual();
        if (!usuario) {
            this.mensajeError = 'No hay un usuario con sesión iniciada.';
            this.cargando = false;
            return;
        }
        this.nombreUsuario = usuario.nombreUsuario;

        // Las dos consultas se piden juntas y se muestran cuando llegaron ambas
        forkJoin({
            unidades: this.inventarioService.obtenerUnidades({ idUsuarioAsignado: usuario.idUsuario }),
            alertas: this.alertaService.obtenerAlertas({
                idUsuarioReporta: usuario.idUsuario,
                estadoAlerta: 'Pendiente',
            }),
        }).subscribe({
            next: ({ unidades, alertas }) => {
                this.unidades = unidades;
                this.idsConNovedad = new Set(alertas.map((a) => a.idUnidadRecurso));
                this.cargando = false;
                this.cdr.detectChanges();
            },
            error: (e) => {
                console.error('Error al cargar los recursos asignados:', e);
                this.mensajeError = 'No se pudieron cargar tus recursos. Intentá nuevamente más tarde.';
                this.cargando = false;
                this.cdr.detectChanges();
            },
        });
    }
}
