import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { InventarioService } from '../../../../services/inventario/inventario-service';
import { UsuarioService } from '../../../../services/usuario/usuario-service';
import { MovimientoInventarioService } from '../../../../services/movimiento-inventario/movimiento-inventario-service';
import { AuthService } from '../../../../services/auth/auth-service';
import { ResumenRecurso } from '../../../../models/resumen-recurso.models';
import { UnidadRecurso, ESTADOS_RECURSO } from '../../../../models/unidad-recurso.models';
import { UsuarioListado } from '../../../../models/usuario-listado.models';
import { Motivo } from '../../../../models/motivo.models';
import { NuevoRetiro } from '../../../../models/retiro.models';

// Una unidad elegida para el retiro, con el estado que declara el supervisor
interface ItemRetiroUI {
    unidad: UnidadRecurso;
    estadoAlRetirar: string;
}

function normalizar(texto: string): string {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

@Component({
    imports: [ReactiveFormsModule],
    selector: 'app-retiro-recurso',
    styleUrl: './retiro-recurso.css',
    templateUrl: './retiro-recurso.html',
})
export class RetiroRecurso implements OnInit {
    // Datos para los desplegables y la tabla
    resumen: ResumenRecurso[] = [];
    unidadesDisponibles: UnidadRecurso[] = [];
    unidadesVisibles: UnidadRecurso[] = [];
    usuarios: UsuarioListado[] = [];
    motivos: Motivo[] = [];
    areaSeleccionadaId: number | null = null;

    // Solo se puede retirar equipo operativo
    estadosOperativos = ESTADOS_RECURSO.filter((e) => e.valor.startsWith('Op-'));

    readonly estadoClases: Record<string, string> = {
        'Op-Bueno': 'bg-success',
        'Op-Regular': 'bg-warning text-dark',
        'Op-Malo': 'bg-danger',
    };

    // Filtros del paso 1 y retiro en armado (paso 2)
    filtroRecursoId: number | null = null;
    terminoBusqueda = '';
    readonly limiteFilas = 50;
    itemsRetiro: ItemRetiroUI[] = [];

    // Mensajes
    mensajeExito = '';
    codigosRetirados: string[] = [];
    erroresServidor: string[] = [];
    enviando = false;

    private fb = inject(FormBuilder);
    private inventarioService = inject(InventarioService);
    private usuarioService = inject(UsuarioService);
    private movimientoService = inject(MovimientoInventarioService);
    private authService = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);

    // Paso 3: quién retira y datos del movimiento
    formularioRetiro: FormGroup = this.fb.group({
        usuarioRetira: ['', Validators.required],
        motivo: [''],
        observaciones: [''],
    });

    ngOnInit(): void {
    this.usuarioService.obtenerUsuarios().subscribe({
        next: (usuarios) => {
            this.usuarios = usuarios.filter(
                (u) => u.activo && u.idRol === 3
            );
            this.cdr.detectChanges();
        },
        error: (e) => console.error('Error al cargar usuarios:', e),
    });

    this.movimientoService.obtenerMotivos('Retiro').subscribe({
        next: (motivos) => {
            this.motivos = motivos;
            this.cdr.detectChanges();
        },
        error: (e) => console.error('Error al cargar motivos:', e),
    });
    this.UsuarioRetira?.valueChanges.subscribe((valor) => {
        this.cambiarUsuarioRetira(valor);
    });
    }

    private cargarResumen(idArea: number): void {
        this.inventarioService.obtenerResumen({ idArea }).subscribe({
            next: (resumen) => {
                this.resumen = resumen.filter((r) => r.disponibles > 0);

                // Si el recurso elegido no está habilitado en el área, se limpia.
                if (
                    this.filtroRecursoId !== null &&
                    !this.resumen.some(
                        (r) => r.idRecurso === this.filtroRecursoId
                    )
                ) {
                    this.filtroRecursoId = null;
                }

                this.aplicarFiltros();
                this.cdr.detectChanges();
            },
            error: (e) => {
                console.error('Error al cargar el resumen:', e);
                this.resumen = [];
                this.cdr.detectChanges();
            },
        });
    }

    cambiarUsuarioRetira(valor: unknown): void {
        const idUsuario = Number(valor);

        const usuarioSeleccionado = valor !== '' && valor !== null
            ? this.usuarios.find((u) => u.idUsuario === idUsuario)
            : undefined;

        const nuevaArea = usuarioSeleccionado?.idArea ?? null;

        if (nuevaArea !== this.areaSeleccionadaId) {
            this.itemsRetiro = [];
            this.filtroRecursoId = null;
            this.terminoBusqueda = '';
        }

        this.areaSeleccionadaId = nuevaArea;
        this.erroresServidor = [];

        if (nuevaArea === null) {
            this.resumen = [];
            this.unidadesDisponibles = [];
            this.unidadesVisibles = [];
            this.cdr.detectChanges();
            return;
        }

        console.log('Bombero seleccionado:', usuarioSeleccionado);
        console.log('Área seleccionada:', nuevaArea);

        this.cargarResumen(nuevaArea);
        this.cargarUnidades(nuevaArea);
    }

    private cargarUnidades(idArea: number): void {
        this.inventarioService.obtenerUnidades({
            disponibilidad: 'Disponible',
            idArea,
        }).subscribe({
            next: (unidades) => {
                this.unidadesDisponibles = unidades.filter(
                    (u) => u.estado.startsWith('Op-')
                );

                this.depurarRetiro();
                this.aplicarFiltros();
                this.cdr.detectChanges();
            },
            error: (e) => {
                console.error('Error al cargar las unidades:', e);
                this.unidadesDisponibles = [];
                this.unidadesVisibles = [];
                this.erroresServidor = [
                    'No se pudieron cargar las unidades disponibles.',
                ];
                this.cdr.detectChanges();
            },
        });
    }

    // Si alguien retiró una unidad mientras armabas el retiro, se quita y se avisa
    private depurarRetiro(): void {
        const vigentes = new Set(this.unidadesDisponibles.map((u) => u.idUnidadRecurso));
        // Las unidades ya agregadas ya no están en "disponibles" del lado del servidor
        // solo si fueron retiradas por otro; las agregadas siguen figurando hasta confirmar
        const perdidas = this.itemsRetiro.filter((i) => !vigentes.has(i.unidad.idUnidadRecurso));
        if (perdidas.length) {
            this.itemsRetiro = this.itemsRetiro.filter((i) => vigentes.has(i.unidad.idUnidadRecurso));
            this.erroresServidor = [
                `Se quitaron del retiro unidades que ya no están disponibles: ` +
                perdidas.map((i) => i.unidad.codigoInterno).join(', ') + '.',
            ];
        }
    }

    // ---------- Paso 1: buscar unidades ----------

    seleccionarRecurso(valor: string): void {
        this.filtroRecursoId = valor ? Number(valor) : null;
        this.aplicarFiltros();
    }

    buscar(termino: string): void {
        this.terminoBusqueda = termino;
        this.aplicarFiltros();
    }

    // Combina recurso + texto, y oculta las unidades que ya están en el retiro
    private aplicarFiltros(): void {
        const termino = normalizar(this.terminoBusqueda);
        const enRetiro = new Set(this.itemsRetiro.map((i) => i.unidad.idUnidadRecurso));

        this.unidadesVisibles = this.unidadesDisponibles.filter((u) => {
            const coincideRecurso =
                this.filtroRecursoId === null || u.idRecurso === this.filtroRecursoId;
            const coincideTexto =
                !termino ||
                [u.codigoInterno, u.nombreRecurso, u.medida ?? '', u.marca ?? '',
                u.numeroSerieFabricante ?? ''].some((c) => normalizar(c).includes(termino));
            return coincideRecurso && coincideTexto && !enRetiro.has(u.idUnidadRecurso);
        });
    }

    // ---------- Paso 2: armar el retiro ----------

    agregarUnidad(unidad: UnidadRecurso): void {
        // Por defecto se propone el estado actual de la unidad
        this.itemsRetiro = [...this.itemsRetiro, { unidad, estadoAlRetirar: unidad.estado }];
        this.erroresServidor = [];
        this.aplicarFiltros();
    }

    quitarUnidad(idUnidad: number): void {
        this.itemsRetiro = this.itemsRetiro.filter((i) => i.unidad.idUnidadRecurso !== idUnidad);
        this.aplicarFiltros();
    }

    cambiarEstado(item: ItemRetiroUI, estado: string): void {
        item.estadoAlRetirar = estado;
    }

    // ---------- Paso 3: confirmar ----------

    registrarRetiro(): void {
        if (this.formularioRetiro.invalid) {
            this.formularioRetiro.markAllAsTouched();
            return;
        }
        if (this.itemsRetiro.length === 0) {
            this.erroresServidor = ['Agregá al menos una unidad al retiro.'];
            return;
        }

        const supervisor = this.authService.obtenerUsuarioActual();
        if (!supervisor) {
            this.erroresServidor = ['No hay un usuario con sesión iniciada.'];
            return;
        }

        this.mensajeExito = '';
        this.codigosRetirados = [];
        this.erroresServidor = [];
        this.enviando = true;

        const retiro: NuevoRetiro = {
            idUsuarioRetira: this.UsuarioRetira?.value,
            idUsuarioRegistra: supervisor.idUsuario,
            idMotivo: this.Motivo?.value || null,
            observaciones: this.Observaciones?.value?.trim() || null,
            unidades: this.itemsRetiro.map((i) => ({
                idUnidadRecurso: i.unidad.idUnidadRecurso,
                estadoAlRetirar: i.estadoAlRetirar,
            })),
        };

        this.movimientoService.registrarRetiro(retiro).subscribe({
            next: (resultado) => {
                this.mensajeExito = resultado.mensaje;
                this.codigosRetirados = resultado.codigos;
                this.itemsRetiro = [];
                this.formularioRetiro.reset({ usuarioRetira: '', motivo: '', observaciones: '' });
                this.enviando = false;
                if (this.areaSeleccionadaId !== null) {
                    this.cargarUnidades(this.areaSeleccionadaId);
                    this.cargarResumen(this.areaSeleccionadaId);
                }
                this.cdr.detectChanges();   
            },
            error: (error: HttpErrorResponse | Error) => {
                this.mostrarErrores(error);
                this.enviando = false;
                if (this.areaSeleccionadaId !== null) {
                    this.cargarUnidades(this.areaSeleccionadaId);
                }
            },
        });
    }

    // Los errores de Django pueden venir anidados ({ unidades: [{ estado_al_retirar: [...] }] }),
    // así que se recorren de forma recursiva hasta juntar todos los textos
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

    get UsuarioRetira() { return this.formularioRetiro.get('usuarioRetira'); }
    get Motivo() { return this.formularioRetiro.get('motivo'); }
    get Observaciones() { return this.formularioRetiro.get('observaciones'); }
}