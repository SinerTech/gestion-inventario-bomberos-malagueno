import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { InventarioService } from '../../services/inventario/inventario-service';
import { ContenidoService } from '../../services/contenido/contenido-service';
import { ResumenRecurso } from '../../models/resumen-recurso.models';
import { UnidadRecurso } from '../../models/unidad-recurso.models';

// Pasa a minúsculas y quita tildes, para que "ignifugo" encuentre "Ignífugo"
function normalizar(texto: string): string {
    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

@Component({
    imports: [DatePipe],
    selector: 'app-control-inventario',
    styleUrl: './control-inventario.css',
    templateUrl: './control-inventario.html',
})
export class ControlInventario implements OnInit {
    // Contenido de interfaz (viene de contenido.json)
    botonesFiltro: string[] = [];
    encabezadosUnidades: string[] = [];

    // Tabla 1: resumen por recurso
    resumen: ResumenRecurso[] = [];
    errorResumen = '';

    // Tabla 2: unidades
    unidades: UnidadRecurso[] = [];
    unidadesFiltradas: UnidadRecurso[] = [];
    errorUnidades = '';

    // Filtros de la tabla de unidades (se combinan entre sí)
    terminoBusqueda = '';
    filtroDisponibilidad = 'todos';
    recursoSeleccionado: ResumenRecurso | null = null;

    // Colores según el estado y la disponibilidad
    readonly estadoClases: Record<string, string> = {
        'Op-Bueno': 'bg-success',
        'Op-Regular': 'bg-warning text-dark',
        'Op-Malo': 'bg-danger',
        'NoOp-Bueno': 'bg-secondary',
        'NoOp-Regular': 'bg-secondary',
        'NoOp-Malo': 'bg-dark',
    };

    readonly disponibilidadClases: Record<string, string> = {
        'Disponible': 'bg-success',
        'En Uso': 'bg-primary',
        'De Baja': 'bg-danger',
    };

    private inventarioService = inject(InventarioService);
    private contenidoService = inject(ContenidoService);
    private ruta = inject(ActivatedRoute);
    private cdr = inject(ChangeDetectorRef);

    ngOnInit(): void {
        // 'administrador' | 'supervisor' | 'bombero', definido en data de la ruta
        const tipoDashboard = this.ruta.snapshot.data['tipoDashboard'];

        this.contenidoService.obtenerDashboard(tipoDashboard).subscribe({
            next: (dashboard) => {
                console.log('Dashboard recibido:', dashboard);
                console.log('Encabezados:', dashboard.encabezadosTabla);
                this.botonesFiltro = dashboard.botonesFiltro;
                this.encabezadosUnidades = dashboard.encabezadosTabla;
                this.cdr.detectChanges();
            },
            error: (e) => console.error('Error al cargar el contenido:', e),
        });

        this.cargarResumen();
        this.cargarUnidades();
    }

    cargarResumen(): void {
        this.errorResumen = '';
        this.inventarioService.obtenerResumen().subscribe({
            next: (resumen) => {
                this.resumen = resumen;
                this.cdr.detectChanges();
            },
            error: (e) => {
                console.error('Error al cargar el resumen:', e);
                this.errorResumen = 'No se pudo cargar el resumen del inventario.';
                this.cdr.detectChanges();
            },
        });
    }

    cargarUnidades(): void {
        this.errorUnidades = '';
        this.inventarioService.obtenerUnidades().subscribe({
            next: (unidades) => {
                this.unidades = unidades;
                this.aplicarFiltros();
                this.cdr.detectChanges();
            },
            error: (e) => {
                console.error('Error al cargar las unidades:', e);
                this.errorUnidades = 'No se pudieron cargar las unidades.';
                this.cdr.detectChanges();
            },
        });
    }

    // ---------- Filtros de la tabla de unidades ----------

    buscarUnidad(termino: string): void {
        this.terminoBusqueda = termino;
        this.aplicarFiltros();
    }

    filtrarPorDisponibilidad(boton: string): void {
        this.filtroDisponibilidad = boton;
        this.aplicarFiltros();
    }

    verUnidadesDe(recurso: ResumenRecurso): void {
        this.recursoSeleccionado = recurso;
        this.aplicarFiltros();
        this.irAUnidades();
    }

    quitarFiltroRecurso(): void {
        this.recursoSeleccionado = null;
        this.aplicarFiltros();
    }

    // Aplica los tres filtros juntos sobre lo ya cargado (sin pedir nada al backend)
    private aplicarFiltros(): void {
        const termino = normalizar(this.terminoBusqueda);

        this.unidadesFiltradas = this.unidades.filter((u) => {
            const coincideRecurso =
                !this.recursoSeleccionado || u.idRecurso === this.recursoSeleccionado.idRecurso;

            const coincideDisponibilidad =
                this.filtroDisponibilidad === 'todos' ||
                normalizar(u.disponibilidad) === normalizar(this.filtroDisponibilidad);

            const coincideTexto =
                !termino ||
                [
                    u.codigoInterno,
                    u.nombreRecurso,
                    u.nombreCategoria,
                    u.medida ?? '',
                    u.marca ?? '',
                    u.numeroSerieFabricante ?? '',
                    u.razonSocial,
                    u.nombreUsuarioAsignado ?? '',
                ].some((campo) => normalizar(campo).includes(termino));

            return coincideRecurso && coincideDisponibilidad && coincideTexto;
        });
    }

    // Lleva la vista hasta la tabla de unidades
    private irAUnidades(): void {
        setTimeout(() => {
            document
                .getElementById('tabla_unidades')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }
}
