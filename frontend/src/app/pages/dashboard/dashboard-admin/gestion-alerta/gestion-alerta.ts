import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AlertaService } from '../../../../services/alerta/alerta-service';
import { AuthService } from '../../../../services/auth/auth-service';
import { Alerta, TIPOS_NOVEDAD } from '../../../../models/alerta.models';
import { FormsModule } from '@angular/forms';

function extraerMensajes(valor: unknown): string[] {
    if (typeof valor === 'string') return [valor];
    if (Array.isArray(valor)) return valor.flatMap((v) => extraerMensajes(v));
    if (valor && typeof valor === 'object') {
        return Object.values(valor).flatMap((v) => extraerMensajes(v));
    }
    return [];
}

// Pasa a minúsculas y quita tildes, para que "reposicion" encuentre "Reposición"
function normalizar(texto: string): string {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

@Component({
    imports: [DatePipe, FormsModule],
    selector: 'app-gestion-alerta',
    styleUrl: './gestion-alerta.css',
    templateUrl: './gestion-alerta.html',
})
export class GestionAlerta implements OnInit {
    alertas: Alerta[] = [];
    alertasFiltradas: Alerta[] = [];
    alertaEnEdicion: number | null = null;
    resolucion = '';
    tipos = TIPOS_NOVEDAD.map((t) => t.valor);

    // Filtros combinables
    filtroEstado = 'Todas';
    filtroTipo = '';
    terminoBusqueda = '';
    readonly botonesEstado = ['Todas', 'Pendiente', 'Atendida'];

    errorListado = '';
    mensajeExito = '';
    erroresServidor: string[] = [];
    procesando: number | null = null; // id de la alerta en proceso (evita doble clic)

    readonly alertaClases: Record<string, string> = {
        Pendiente: 'bg-warning text-dark',
        Atendida: 'bg-success',
    };

    private alertaService = inject(AlertaService);
    private authService = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);

    ngOnInit(): void {
        this.cargarAlertas();
    }

    get totalPendientes(): number {
        return this.alertas.filter((a) => a.estadoAlerta === 'Pendiente').length;
    }

    get totalAtendidas(): number {
        return this.alertas.filter((a) => a.estadoAlerta === 'Atendida').length;
    }

    cargarAlertas(): void {
        this.errorListado = '';
        this.alertaService.obtenerAlertas().subscribe({
            next: (alertas) => {
                this.alertas = alertas;
                this.aplicarFiltros();
                this.cdr.detectChanges();
            },
            error: (e) => {
                console.error('Error al cargar alertas:', e);
                this.errorListado = 'No se pudieron cargar las alertas.';
                this.cdr.detectChanges();
            },
        });
    }

    filtrarPorEstado(estado: string): void {
        this.filtroEstado = estado;
        this.aplicarFiltros();
    }

    filtrarPorTipo(tipo: string): void {
        this.filtroTipo = tipo;
        this.aplicarFiltros();
    }

    buscarAlerta(termino: string): void {
        this.terminoBusqueda = termino;
        this.aplicarFiltros();
    }

    private aplicarFiltros(): void {
        const termino = normalizar(this.terminoBusqueda);

        this.alertasFiltradas = this.alertas.filter((a) => {
            const coincideEstado = this.filtroEstado === 'Todas' || a.estadoAlerta === this.filtroEstado;
            const coincideTipo = !this.filtroTipo || a.tipo === this.filtroTipo;
            const coincideTexto =
                !termino ||
                [
                    a.codigoInterno,
                    a.nombreRecurso,
                    a.descripcion,
                    a.nombreUsuarioReporta ?? '',
                    a.nombreUsuarioGestiona ?? '',
                ].some((c) => normalizar(c).includes(termino));
            return coincideEstado && coincideTipo && coincideTexto;
        });
    }

    atender(alerta: Alerta): void {
        this.alertaEnEdicion = alerta.idAlerta;
        this.resolucion = '';
        this.erroresServidor = [];
    }

    cancelarAtencion(): void {
        this.alertaEnEdicion = null;
        this.resolucion = '';
        this.erroresServidor = [];
    }

    confirmarAtencion(alerta: Alerta): void {
        this.enviarGestion(
            alerta,
            'Atendida',
            this.resolucion.trim() || null
        );

        this.alertaEnEdicion = null;
        this.resolucion = '';
    }

    reabrir(alerta: Alerta): void {
        if (!confirm(`¿Reabrir la alerta de ${alerta.codigoInterno} como pendiente?`)) return;
        this.enviarGestion(alerta, 'Pendiente', null);
        this.cdr.detectChanges()
    }

    private enviarGestion(alerta: Alerta, estado: 'Pendiente' | 'Atendida', resolucion: string | null): void {
        const admin = this.authService.obtenerUsuarioActual();
        if (!admin) {
            this.erroresServidor = ['No hay un usuario con sesión iniciada.'];
            return;
        }

        this.mensajeExito = '';
        this.erroresServidor = [];
        this.procesando = alerta.idAlerta;

        this.alertaService
            .gestionarAlerta(alerta.idAlerta, {
                estadoAlerta: estado,
                idUsuarioGestiona: admin.idUsuario,
                resolucion,
            })
            .subscribe({
                next: (respuesta) => {
                    this.mensajeExito = respuesta.mensaje;
                    this.procesando = null;
                    this.cargarAlertas(); // refresca lista y contadores
                },
                error: (error: HttpErrorResponse | Error) => {
                    this.erroresServidor =
                        error instanceof HttpErrorResponse
                            ? extraerMensajes(error.error)
                            : [error.message];
                    this.procesando = null;
                    this.cargarAlertas(); // por si otro admin ya la había modificado
                },
            });
    }
}
