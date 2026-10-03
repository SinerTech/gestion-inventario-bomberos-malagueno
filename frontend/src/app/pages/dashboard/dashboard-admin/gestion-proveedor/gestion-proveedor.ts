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

    // Listado
    proveedores: Proveedor[] = [];
    proveedoresFiltrados: Proveedor[] = [];
    terminoBusqueda = '';
    errorListado = '';

    // Hardcodeado
    accionesTabla = [
        { icono: 'bi bi-pencil-fill' },
        { icono: 'bi bi-trash-fill' },
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

    // Por ahora solo identifica la acción; la lógica llega en las HU de editar y eliminar
    ejecutarAccion(icono: string, proveedor: Proveedor): void {
        switch (icono) {
            case 'bi bi-pencil-fill':
                console.log('Modificar proveedor:', proveedor);
                break;
            case 'bi bi-trash-fill':
                console.log('Eliminar proveedor:', proveedor);
                break;
        }
    }

    alternarFormulario(): void {
        this.mostrarFormulario = !this.mostrarFormulario;
        this.mensajeExito = '';
        this.erroresServidor = [];
    }

    registrarNuevoProveedor(): void {
        if (this.formularioRegistroNuevoProveedor.invalid) {
            this.formularioRegistroNuevoProveedor.markAllAsTouched();
            return;
        }
        this.mensajeExito = '';
        this.erroresServidor = [];

        const nuevoProveedor = {
            razonSocial: this.RazonSocial?.value,
            cuit: this.Cuit?.value,
            // los campos opcionales vacíos se envían como null
            telefonoProveedor: this.Telefono?.value || null,
            emailProveedor: this.Email?.value || null,
        };

        this.proveedorService.registrarProveedor(nuevoProveedor).subscribe({
            next: (respuesta) => {
                this.mensajeExito = respuesta.mensaje;
                this.formularioRegistroNuevoProveedor.reset();
                this.mostrarFormulario = false;
                this.cargarProveedores(); // refresca la tabla con el proveedor nuevo
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
