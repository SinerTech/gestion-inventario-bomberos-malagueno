import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ProveedorService } from '../../../../services/proveedor/proveedor-service';
import { Proveedor } from '../../../../models/proveedor.models';

// Pasa a minúsculas y quita tildes, para que "Cordoba" encuentre "Córdoba"
function normalizar(texto: string): string {
    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

@Component({
    imports: [ReactiveFormsModule],
    selector: 'app-gestion-proveedor',
    styleUrl: './gestion-proveedor.css',
    templateUrl: './gestion-proveedor.html',
})
export class GestionProveedor implements OnInit {
    mostrarFormulario = false;
    mensajeExito = '';
    erroresServidor: string[] = [];
    modoEdicion = false;
    idProveedorEditar: number | null = null;


    // Listado
    proveedores: Proveedor[] = [];
    proveedoresFiltrados: Proveedor[] = [];
    terminoBusqueda = '';
    errorListado = '';

    accionesTabla = [
        { id: 'editar', icono: 'bi bi-pencil-fill', titulo: 'Modificar proveedor' },
    ];

    private fb = inject(FormBuilder);
    private proveedorService = inject(ProveedorService);
    private cdr = inject(ChangeDetectorRef);

    formularioRegistroNuevoProveedor: FormGroup = this.fb.group({
        razonSocial: ['', [Validators.required, Validators.maxLength(100)]],
        cuit: ['', [Validators.required, Validators.pattern(/^\d{2}-?\d{8}-?\d$/)]],
        telefono: ['', Validators.pattern(/^[0-9+\-\s()]{6,20}$/)],
        email: ['', [Validators.email, Validators.maxLength(100)]],
    });

    ngOnInit(): void {
        this.cargarProveedores();
    }

    cargarProveedores(): void {
        this.errorListado = '';
        this.proveedorService.obtenerProveedores().subscribe({
            next: (proveedores) => {
                this.proveedores = proveedores;
                this.aplicarFiltro();
                this.cdr.detectChanges();
            },
            error: (error: Error) => {
                console.error('Error al cargar proveedores:', error);
                this.errorListado = 'No se pudieron cargar los proveedores.';
                this.cdr.detectChanges();
            },
        });
    }

    // Filtra sobre lo ya cargado, sin volver a pedir datos al backend
    buscarProveedor(termino: string): void {
        this.terminoBusqueda = termino;
        this.aplicarFiltro();
    }

    private aplicarFiltro(): void {
        const termino = normalizar(this.terminoBusqueda);

        if (!termino) {
            this.proveedoresFiltrados = [...this.proveedores];
            return;
        }

        this.proveedoresFiltrados = this.proveedores.filter((p) =>
            [
                String(p.idProveedor),
                p.razonSocial,
                p.cuit,
                p.telefonoProveedor ?? '',
                p.emailProveedor ?? '',
            ].some((campo) => normalizar(campo).includes(termino))
        );
    }

    ejecutarAccion(idAccion: string, proveedor: Proveedor): void {
        if (idAccion === 'editar') this.iniciarEdicion(proveedor);
    }

    iniciarEdicion(proveedor: Proveedor): void {
        this.modoEdicion = true;
        this.idProveedorEditar = proveedor.idProveedor;
        this.mostrarFormulario = true;
        this.mensajeExito = '';
        this.erroresServidor = [];

        this.formularioRegistroNuevoProveedor.reset({
            razonSocial: proveedor.razonSocial,
            cuit: proveedor.cuit,
            telefono: proveedor.telefonoProveedor ?? '',
            email: proveedor.emailProveedor ?? '',
        });

        this.cdr.detectChanges();
        setTimeout(() =>
            document.getElementById('formulario_proveedor')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        );
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

    guardarProveedor(): void {
        if (this.formularioRegistroNuevoProveedor.invalid) {
            this.formularioRegistroNuevoProveedor.markAllAsTouched();
            return;
        }
        this.mensajeExito = '';
        this.erroresServidor = [];

        const datos = {
            razonSocial: this.RazonSocial?.value,
            cuit: this.Cuit?.value,
            telefonoProveedor: this.Telefono?.value || null,
            emailProveedor: this.Email?.value || null,
        };

        const peticion =
            this.modoEdicion && this.idProveedorEditar !== null
                ? this.proveedorService.modificar(this.idProveedorEditar, datos)
                : this.proveedorService.registrarProveedor(datos);

        peticion.subscribe({
            next: (respuesta) => {
                this.mensajeExito = respuesta.mensaje;
                this.cerrarFormulario();
                this.cargarProveedores();
                this.cdr.detectChanges();
            },
            error: (error: HttpErrorResponse | Error) => {
                this.erroresServidor =
                    error instanceof HttpErrorResponse
                        ? Object.values(error.error).flat().map(String)
                        : [error.message];
                this.cdr.detectChanges();
            },
        });
    }

    private cerrarFormulario(): void {
        this.mostrarFormulario = false;
        this.modoEdicion = false;
        this.idProveedorEditar = null;
        this.formularioRegistroNuevoProveedor.reset({
            razonSocial: '', cuit: '', telefono: '', email: '',
        });
    }

    get RazonSocial() {
        return this.formularioRegistroNuevoProveedor.get('razonSocial');
    }
    get Cuit() {
        return this.formularioRegistroNuevoProveedor.get('cuit');
    }
    get Telefono() {
        return this.formularioRegistroNuevoProveedor.get('telefono');
    }
    get Email() {
        return this.formularioRegistroNuevoProveedor.get('email');
    }
}
