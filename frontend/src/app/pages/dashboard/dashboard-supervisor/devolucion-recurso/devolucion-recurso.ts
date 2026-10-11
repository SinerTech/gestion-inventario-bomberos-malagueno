import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { InventarioService } from '../../../../services/inventario/inventario-service';
import { UsuarioService } from '../../../../services/usuario/usuario-service';
import { MovimientoInventarioService } from '../../../../services/movimiento-inventario/movimiento-inventario-service';
import { AuthService } from '../../../../services/auth/auth-service';
import { UnidadRecurso, ESTADOS_RECURSO } from '../../../../models/unidad-recurso.models';
import { UsuarioListado } from '../../../../models/usuario-listado.models';
import { NuevaDevolucion } from '../../../../models/devolucion.models';

// Una unidad elegida para devolver, con el estado en que vuelve
interface ItemDevolucionUI {
    unidad: UnidadRecurso;
    estadoAlDevolver: string;
}

@Component({
    imports: [ReactiveFormsModule],
    selector: 'app-devolucion-recurso',
    styleUrl: './devolucion-recurso.css',
    templateUrl: './devolucion-recurso.html',
})
export class DevolucionRecurso implements OnInit {
    usuarios: UsuarioListado[] = [];
    unidadesEnUso: UnidadRecurso[] = [];     // lo que tiene la persona elegida
    unidadesVisibles: UnidadRecurso[] = [];  // tras el filtro por recurso
    recursosDelUsuario: { idRecurso: number; nombreRecurso: string }[] = [];
    itemsDevolucion: ItemDevolucionUI[] = [];

    // Al devolver puede volver en cualquier estado, también no operativo
    estados = ESTADOS_RECURSO;

    readonly estadoClases: Record<string, string> = {
        'Op-Bueno': 'bg-success',
        'Op-Regular': 'bg-warning text-dark',
        'Op-Malo': 'bg-danger',
        'NoOp-Bueno': 'bg-secondary',
        'NoOp-Regular': 'bg-secondary',
        'NoOp-Malo': 'bg-dark',
    };

    usuarioSeleccionadoId: number | null = null;
    filtroRecursoId: number | null = null;
    cargandoUnidades = false;

    mensajeExito = '';
    codigosDevueltos: string[] = [];
    erroresServidor: string[] = [];
    enviando = false;

    private fb = inject(FormBuilder);
    private inventarioService = inject(InventarioService);
    private usuarioService = inject(UsuarioService);
    private movimientoService = inject(MovimientoInventarioService);
    private authService = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);

    formularioDevolucion: FormGroup = this.fb.group({
        observaciones: [''],
    });

    ngOnInit(): void {
        this.usuarioService.obtenerUsuarios().subscribe({
            next: (usuarios) => {
                this.usuarios = usuarios.filter((u) => u.activo && u.idRol === 3);
                this.cdr.detectChanges();
            },
            error: (e) => console.error('Error al cargar usuarios:', e),
        });
    }

    // ---------- Paso 1: quién devuelve ----------

    seleccionarUsuario(valor: string): void {
        this.usuarioSeleccionadoId = valor ? Number(valor) : null;
        this.itemsDevolucion = [];
        this.filtroRecursoId = null;
        this.erroresServidor = [];
        this.mensajeExito = '';

        if (this.usuarioSeleccionadoId === null) {
            this.unidadesEnUso = [];
            this.aplicarFiltro();
            return;
        }
        this.cargarUnidadesEnUso();
    }

    // Pide al servidor solo lo que esa persona tiene en uso
    private cargarUnidadesEnUso(): void {
        if (this.usuarioSeleccionadoId === null) return;
        this.cargandoUnidades = true;

        this.inventarioService
            .obtenerUnidades({
                disponibilidad: 'En Uso',
                idUsuarioAsignado: this.usuarioSeleccionadoId,
            })
            .subscribe({
                next: (unidades) => {
                    this.unidadesEnUso = unidades;

                    // Recursos distintos, para el filtro opcional
                    const vistos = new Map<number, string>();
                    unidades.forEach((u) => vistos.set(u.idRecurso, u.nombreRecurso));
                    this.recursosDelUsuario = [...vistos].map(([idRecurso, nombreRecurso]) => ({
                        idRecurso,
                        nombreRecurso,
                    }));

                    this.cargandoUnidades = false;
                    this.aplicarFiltro();
                    this.cdr.detectChanges();
                },
                error: (e) => {
                    console.error('Error al cargar las unidades:', e);
                    this.erroresServidor = ['No se pudieron cargar las unidades de este usuario.'];
                    this.cargandoUnidades = false;
                    this.cdr.detectChanges();
                },
            });
    }

    // ---------- Paso 2: elegir unidades ----------

    seleccionarRecurso(valor: string): void {
        this.filtroRecursoId = valor ? Number(valor) : null;
        this.aplicarFiltro();
    }

    // Filtra por recurso y oculta las que ya están en la devolución
    private aplicarFiltro(): void {
        const enDevolucion = new Set(this.itemsDevolucion.map((i) => i.unidad.idUnidadRecurso));
        this.unidadesVisibles = this.unidadesEnUso.filter(
            (u) =>
                (this.filtroRecursoId === null || u.idRecurso === this.filtroRecursoId) &&
                !enDevolucion.has(u.idUnidadRecurso)
        );
    }

    agregarUnidad(unidad: UnidadRecurso): void {
        // Por defecto se propone el estado actual de la unidad
        this.itemsDevolucion = [
            ...this.itemsDevolucion,
            { unidad, estadoAlDevolver: unidad.estado },
        ];
        this.erroresServidor = [];
        this.aplicarFiltro();
    }

    agregarTodas(): void {
        const nuevos = this.unidadesVisibles.map((unidad) => ({
            unidad,
            estadoAlDevolver: unidad.estado,
        }));
        this.itemsDevolucion = [...this.itemsDevolucion, ...nuevos];
        this.aplicarFiltro();
    }

    quitarUnidad(idUnidad: number): void {
        this.itemsDevolucion = this.itemsDevolucion.filter(
            (i) => i.unidad.idUnidadRecurso !== idUnidad
        );
        this.aplicarFiltro();
    }

    cambiarEstado(item: ItemDevolucionUI, estado: string): void {
        item.estadoAlDevolver = estado;
    }

    // ---------- Paso 3: confirmar ----------

    registrarDevolucion(): void {
        if (this.usuarioSeleccionadoId === null) {
            this.erroresServidor = ['Seleccioná quién devuelve.'];
            return;
        }
        if (this.itemsDevolucion.length === 0) {
            this.erroresServidor = ['Agregá al menos una unidad a la devolución.'];
            return;
        }

        const supervisor = this.authService.obtenerUsuarioActual();
        if (!supervisor) {
            this.erroresServidor = ['No hay un usuario con sesión iniciada.'];
            return;
        }

        this.mensajeExito = '';
        this.codigosDevueltos = [];
        this.erroresServidor = [];
        this.enviando = true;

        const devolucion: NuevaDevolucion = {
            idUsuarioDevuelve: this.usuarioSeleccionadoId,
            idUsuarioRegistra: supervisor.idUsuario,
            observaciones: this.Observaciones?.value?.trim() || null,
            unidades: this.itemsDevolucion.map((i) => ({
                idUnidadRecurso: i.unidad.idUnidadRecurso,
                estadoAlDevolver: i.estadoAlDevolver,
            })),
        };

        this.movimientoService.registrarDevolucion(devolucion).subscribe({
            next: (resultado) => {
                this.mensajeExito = resultado.mensaje;
                this.codigosDevueltos = resultado.codigos;
                this.itemsDevolucion = [];
                this.formularioDevolucion.reset({ observaciones: '' });
                this.enviando = false;
                this.cargarUnidadesEnUso(); // lo devuelto deja de estar en uso
                this.cdr.detectChanges();
            },
            error: (error: HttpErrorResponse | Error) => {
                this.mostrarErrores(error);
                this.enviando = false;
                this.cargarUnidadesEnUso(); // por si el 409 se debió a datos viejos
            },
        });
    }

    // Los errores de Django pueden venir anidados: se recorren hasta juntar los textos
    private extraerMensajes(valor: unknown): string[] {
        if (typeof valor === 'string') return [valor];
        if (Array.isArray(valor)) return valor.flatMap((v) => this.extraerMensajes(v));
        if (valor && typeof valor === 'object') {
            return Object.values(valor).flatMap((v) => this.extraerMensajes(v));
        }
        return [];
    }

    private mostrarErrores(error: HttpErrorResponse | Error): void {
        this.erroresServidor =
            error instanceof HttpErrorResponse
                ? this.extraerMensajes(error.error)
                : [error.message];
        this.cdr.detectChanges();
    }

    get Observaciones() { return this.formularioDevolucion.get('observaciones'); }
}
