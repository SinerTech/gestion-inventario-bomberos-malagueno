import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import {
    AbstractControl,
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    ValidationErrors,
    Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RecursoService } from '../../../../services/recurso/recurso-service';
import { Recurso } from '../../../../models/recurso.models';
import { Categoria } from '../../../../models/categoria.models';
import { TipoMaterial } from '../../../../models/tipo-material.models';
import { AccionTabla } from '../../../../models/contenido.models';
import { ContenidoService } from '../../../../services/contenido/contenido-service';

// El nombre debe contener al menos una letra (no solo números o símbolos)
function nombreValido(control: AbstractControl): ValidationErrors | null {
    const valor = control.value;
    if (!valor) {
        return null;
    }
    return /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(valor) ? null : { nombreInvalido: true };
}

// Pasa a minúsculas y quita tildes, para que "ignifugo" encuentre "Ignífugo"
function normalizar(texto: string): string {
    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

@Component({
    imports: [ReactiveFormsModule],
    selector: 'app-gestion-recurso',
    styleUrl: './gestion-recurso.css',
    templateUrl: './gestion-recurso.html',
})
export class GestionRecurso implements OnInit {
    mostrarFormulario = false;
    modoEdicion = false; 
    idRecursoEditar: number | null = null;   
    categorias: Categoria[] = [];
    tiposMaterial: TipoMaterial[] = [];
    mensajeExito = '';
    erroresServidor: string[] = [];
    accionesTabla: AccionTabla[] = []; 

    // Listado
    recursos: Recurso[] = [];
    recursosFiltrados: Recurso[] = [];
    terminoBusqueda = '';
    errorListado = '';

    private fb = inject(FormBuilder);
    private recursoService = inject(RecursoService);
    private cdr = inject(ChangeDetectorRef);
    private contenidoService = inject(ContenidoService)

    formularioRegistroNuevoRecurso: FormGroup = this.fb.group({
        nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(60), nombreValido]],
        categoria: ['', Validators.required],
        tiposMaterial: [[] as number[]], // opcional
    });

    ngOnInit(): void {
        this.recursoService.obtenerCategorias().subscribe({
            next: (categorias) => {
                this.categorias = categorias;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error al cargar categorías:', error);
                this.cdr.detectChanges();
            },
        });

        this.recursoService.obtenerTiposMaterial().subscribe({
            next: (tipos) => {
                this.tiposMaterial = tipos;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error al cargar tipos de material:', error);
                this.cdr.detectChanges();
            },
        });
        this.cargarRecursos();

        this.contenidoService.obtenerDashboard('administrador').subscribe({
            next: (dashboard) => {
                this.accionesTabla = dashboard.accionesTabla;
                this.cdr.detectChanges();
            },
            error: (error) => console.error('Error al cargar las acciones:', error),
        });
    }

    cargarRecursos(): void {
        this.errorListado = '';
        this.recursoService.obtenerRecursos().subscribe({
            next: (recursos) => {
                this.recursos = recursos;
                this.aplicarFiltro();
                this.cdr.detectChanges();
            },
            error: (error: Error) => {
                console.error('Error al cargar recursos:', error);
                this.errorListado = 'No se pudieron cargar los recursos.';
                this.cdr.detectChanges();
            },
        });
    }

    // Filtra sobre lo ya cargado, sin volver a pedir datos al backend
    buscarRecurso(termino: string): void {
        this.terminoBusqueda = termino;
        this.aplicarFiltro();
    }

    private aplicarFiltro(): void {
        const termino = normalizar(this.terminoBusqueda);

        if (!termino) {
            this.recursosFiltrados = [...this.recursos];
            return;
        }

        this.recursosFiltrados = this.recursos.filter((r) =>
            [
                String(r.idRecurso),
                r.nombreRecurso,
                r.nombreCategoria,
                ...r.tiposMaterial.map((t) => t.nombreTipoMaterial),
            ].some((campo) => normalizar(campo).includes(termino))
        );
    }

    ejecutarAccion(idAccion: string, recurso: Recurso): void {
        switch (idAccion) {
            case 'editar':
                this.iniciarEdicion(recurso);
                break;
            case 'eliminar':
                this.eliminarRecurso(recurso);
                break;
        }
    }

    alternarFormulario(): void {
        if (this.mostrarFormulario) {
            this.cerrarFormulario();
        } else {
            this.mostrarFormulario = true;
        }
        this.mensajeExito = '';
        this.erroresServidor = [];
    }

    limpiarFormulario(): void {
        this.formularioRegistroNuevoRecurso.reset({
            nombre: '',
            categoria: '',
            tiposMaterial: [],
        });
        this.erroresServidor = [];
    }

    // Checklist de tipos de material
    estaSeleccionado(idTipoMaterial: number): boolean {
        const seleccionados: number[] = this.TiposMaterial?.value ?? [];
        return seleccionados.includes(idTipoMaterial);
    }

    alternarTipoMaterial(idTipoMaterial: number, marcado: boolean): void {
        const seleccionados: number[] = this.TiposMaterial?.value ?? [];

        const nuevos = marcado
            ? [...seleccionados, idTipoMaterial]
            : seleccionados.filter((id) => id !== idTipoMaterial);

        this.TiposMaterial?.setValue(nuevos);
    }

    guardarRecurso(): void {
        if (this.formularioRegistroNuevoRecurso.invalid) {
            this.formularioRegistroNuevoRecurso.markAllAsTouched();
            return;
        }
        this.mensajeExito = '';
        this.erroresServidor = [];

        const datos = {
            nombreRecurso: String(this.Nombre?.value).trim(),
            idCategoria: this.Categoria?.value,
            idsTipoMaterial: this.TiposMaterial?.value ?? [],
        };

        const peticion =
            this.modoEdicion && this.idRecursoEditar !== null
                ? this.recursoService.modificar(this.idRecursoEditar, datos)
                : this.recursoService.registro(datos);

        peticion.subscribe({
            next: (respuesta) => this.finalizarOperacion(respuesta.mensaje),
            error: (error: HttpErrorResponse | Error) => this.mostrarErrores(error),
        });
    }

    private finalizarOperacion(mensaje: string): void {
        this.mensajeExito = mensaje;
        this.cerrarFormulario();
        this.cargarRecursos(); // refresca la tabla
        this.cdr.detectChanges();
    }

    private mostrarErrores(error: HttpErrorResponse | Error): void {
        if (error instanceof HttpErrorResponse) {
            this.erroresServidor = Object.values(error.error).flat().map(String);
        } else {
            this.erroresServidor = [error.message];
        }
        this.cdr.detectChanges();
    }

    private cerrarFormulario(): void {
        this.mostrarFormulario = false;
        this.modoEdicion = false;
        this.idRecursoEditar = null;
        this.limpiarFormulario();
    }

    iniciarEdicion(recurso: Recurso): void {
        this.modoEdicion = true;
        this.idRecursoEditar = recurso.idRecurso;
        this.mostrarFormulario = true;
        this.mensajeExito = '';
        this.erroresServidor = [];

        // reset con valores: carga los datos y limpia los estados "tocado"
        this.formularioRegistroNuevoRecurso.reset({
            nombre: recurso.nombreRecurso,
            categoria: recurso.idCategoria,
            tiposMaterial: recurso.tiposMaterial.map((t) => t.idTipoMaterial),
        });
        this.cdr.detectChanges();
        this.irAlFormulario();
    }

    eliminarRecurso(recurso: Recurso): void {
        const confirmado = confirm(
            `¿Eliminar el recurso "${recurso.nombreRecurso}"? Esta acción no se puede deshacer.`
        );
        if (!confirmado) return;

        this.mensajeExito = '';
        this.errorListado = '';
        this.recursoService.eliminar(recurso.idRecurso).subscribe({
            next: (respuesta) => {
                this.mensajeExito = respuesta.mensaje;
                this.cargarRecursos();
                this.cdr.detectChanges();
            },
            error: (error: HttpErrorResponse | Error) => {
                // El 409 llega como HttpErrorResponse con { error: "mensaje" }
                this.errorListado =
                    error instanceof HttpErrorResponse
                        ? Object.values(error.error).flat().map(String).join(' ')
                        : error.message;
                this.cdr.detectChanges();
            },
        });
    }

    private irAlFormulario(): void {
        setTimeout(() => {
            document
                .getElementById('formulario_recurso')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    get Nombre() {
        return this.formularioRegistroNuevoRecurso.get('nombre');
    }
    get Categoria() {
        return this.formularioRegistroNuevoRecurso.get('categoria');
    }
    get TiposMaterial() {
        return this.formularioRegistroNuevoRecurso.get('tiposMaterial');
    }
}