import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MovimientoInventarioService } from '../../services/movimiento-inventario/movimiento-inventario-service';
import { RecursoService } from '../../services/recurso/recurso-service';
import { ProveedorService } from '../../services/proveedor/proveedor-service';
import { AuthService } from '../../services/auth/auth-service';
import { Recurso } from '../../models/recurso.models';
import { Proveedor } from '../../models/proveedor.models';
import { Motivo } from '../../models/motivo.models';
import { FONDOS, ESTADOS_RECURSO } from '../../models/unidad-recurso.models';

@Component({
    imports: [ReactiveFormsModule],
    selector: 'app-registro-ingreso',
    styleUrl: './registro-ingreso.css',
    templateUrl: './registro-ingreso.html',
})
export class RegistroIngreso implements OnInit {
    recursos: Recurso[] = [];
    proveedores: Proveedor[] = [];
    motivos: Motivo[] = [];
    fondos = FONDOS;
    estados = ESTADOS_RECURSO;

    mensajeExito = '';
    codigosGenerados: string[] = [];
    erroresServidor: string[] = [];
    enviando = false; // evita enviar dos veces el mismo ingreso

    private fb = inject(FormBuilder);
    private movimientoService = inject(MovimientoInventarioService);
    private recursoService = inject(RecursoService);
    private proveedorService = inject(ProveedorService);
    private authService = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);

    formularioIngreso: FormGroup = this.fb.group({
        // Datos del ingreso
        recurso: ['', Validators.required],
        cantidad: [1, [Validators.required, Validators.min(1), Validators.max(200), Validators.pattern(/^\d+$/)]],
        proveedor: ['', Validators.required],
        motivo: ['', Validators.required],
        numeroLoteFactura: ['', [Validators.required, Validators.maxLength(100)]],
        // Datos que se copian a cada unidad
        medida: ['', Validators.maxLength(60)],
        marca: ['', Validators.maxLength(100)],
        valor: [null as number | null, Validators.min(0)],
        fondo: ['Propio', Validators.required],
        estado: ['Op-Bueno', Validators.required],
        observaciones: [''],
    });

    ngOnInit(): void {
        this.recursoService.obtenerRecursos().subscribe({
            next: (recursos) => {
                this.recursos = recursos;
                this.cdr.detectChanges();
            },
            error: (e) => console.error('Error al cargar recursos:', e),
        });

        this.proveedorService.obtenerProveedores().subscribe({
            next: (proveedores) => {
                this.proveedores = proveedores;
                this.cdr.detectChanges();
            },
            error: (e) => console.error('Error al cargar proveedores:', e),
        });

        this.movimientoService.obtenerMotivos().subscribe({
            next: (motivos) => {
                this.motivos = motivos;
                this.cdr.detectChanges();
            },
            error: (e) => console.error('Error al cargar motivos:', e),
        });
    }

    registrarIngreso(): void {
        if (this.formularioIngreso.invalid) {
            this.formularioIngreso.markAllAsTouched();
            return;
        }

        const usuario = this.authService.obtenerUsuarioActual();
        if (!usuario) {
            this.erroresServidor = ['No hay un usuario con sesión iniciada.'];
            return;
        }

        this.mensajeExito = '';
        this.codigosGenerados = [];
        this.erroresServidor = [];
        this.enviando = true;

        const ingreso = {
            idRecurso: this.Recurso?.value,
            cantidad: this.Cantidad?.value,
            idProveedor: this.Proveedor?.value,
            idMotivo: this.Motivo?.value,
            numeroLoteFactura: String(this.NumeroLoteFactura?.value).trim(),
            idUsuarioRegistra: usuario.idUsuario,
            // los campos opcionales vacíos se envían como null
            medida: this.Medida?.value?.trim() || null,
            marca: this.Marca?.value?.trim() || null,
            valor: this.Valor?.value ?? null,
            fondo: this.Fondo?.value,
            estado: this.Estado?.value,
            observaciones: this.Observaciones?.value?.trim() || null,
        };

        this.movimientoService.registrarIngreso(ingreso).subscribe({
            next: (resultado) => {
                this.mensajeExito = resultado.mensaje;
                this.codigosGenerados = resultado.codigos;
                this.limpiarFormulario();
                this.enviando = false;
                this.cdr.detectChanges();
            },
            error: (error: HttpErrorResponse | Error) => {
                if (error instanceof HttpErrorResponse) {
                    this.erroresServidor = Object.values(error.error).flat().map(String);
                } else {
                    this.erroresServidor = [error.message];
                }
                this.enviando = false;
                this.cdr.detectChanges();
            },
        });
    }

    limpiarFormulario(): void {
        this.formularioIngreso.reset({
            recurso: '',
            cantidad: 1,
            proveedor: '',
            motivo: '',
            numeroLoteFactura: '',
            medida: '',
            marca: '',
            valor: null,
            fondo: 'Propio',
            estado: 'Op-Bueno',
            observaciones: '',
        });
    }

    get Recurso() { return this.formularioIngreso.get('recurso'); }
    get Cantidad() { return this.formularioIngreso.get('cantidad'); }
    get Proveedor() { return this.formularioIngreso.get('proveedor'); }
    get Motivo() { return this.formularioIngreso.get('motivo'); }
    get NumeroLoteFactura() { return this.formularioIngreso.get('numeroLoteFactura'); }
    get Medida() { return this.formularioIngreso.get('medida'); }
    get Marca() { return this.formularioIngreso.get('marca'); }
    get Valor() { return this.formularioIngreso.get('valor'); }
    get Fondo() { return this.formularioIngreso.get('fondo'); }
    get Estado() { return this.formularioIngreso.get('estado'); }
    get Observaciones() { return this.formularioIngreso.get('observaciones'); }
}
