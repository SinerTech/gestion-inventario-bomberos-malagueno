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
    categorias: Categoria[] = [];
    tiposMaterial: TipoMaterial[] = [];
    mensajeExito = '';
    erroresServidor: string[] = [];

    // Listado
    recursos: Recurso[] = [];
    recursosFiltrados: Recurso[] = [];
    terminoBusqueda = '';
    errorListado = '';

    // Hardcodeado
    accionesTabla = [
        { icono: 'bi bi-pencil-fill' },
        { icono: 'bi bi-trash-fill' },
    ];

    private fb = inject(FormBuilder);
    private recursoService = inject(RecursoService);
    private cdr = inject(ChangeDetectorRef);

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

    // Por ahora solo identifica la acción; la lógica llega en las HU de editar y eliminar
    ejecutarAccion(icono: string, recurso: Recurso): void {
        switch (icono) {
            case 'bi bi-pencil-fill':
                console.log('Modificar recurso:', recurso);
                break;
            case 'bi bi-trash-fill':
                console.log('Eliminar recurso:', recurso);
                break;
        }
    }

    alternarFormulario(): void {
        this.mostrarFormulario = !this.mostrarFormulario;
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

    registrarNuevoRecurso(): void {
        if (this.formularioRegistroNuevoRecurso.invalid) {
            this.formularioRegistroNuevoRecurso.markAllAsTouched();
            return;
        }
        this.mensajeExito = '';
        this.erroresServidor = [];

        const nuevoRecurso = {
            nombreRecurso: String(this.Nombre?.value).trim(),
            idCategoria: this.Categoria?.value,
            idsTipoMaterial: this.TiposMaterial?.value ?? [],
        };

        this.recursoService.registro(nuevoRecurso).subscribe({
            next: (respuesta) => {
                this.mensajeExito = respuesta.mensaje;
                this.limpiarFormulario();
                this.mostrarFormulario = false;
                this.cargarRecursos(); // refresca la tabla con el recurso nuevo
                this.cdr.detectChanges();
            },
            error: (error: HttpErrorResponse | Error) => {
                if (error instanceof HttpErrorResponse) {
                    // Django devuelve { campo: ["mensaje", ...] } al fallar una validación
                    this.erroresServidor = Object.values(error.error).flat().map(String);
                } else {
                    this.erroresServidor = [error.message];
                }
                this.cdr.detectChanges();
            },
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