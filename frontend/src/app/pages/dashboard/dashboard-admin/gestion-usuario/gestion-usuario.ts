import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
    AbstractControl,
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    ValidationErrors,
    Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { UsuarioService } from '../../../../services/usuario/usuario-service';
import { Rol } from '../../../../models/rol.models';
import { Area } from '../../../../models/area.models';
import { UsuarioListado } from '../../../../models/usuario-listado.models';
import { TitleCasePipe } from '@angular/common';

// Validador del grupo completo: compara las dos contraseñas
function passwordsIguales(grupo: AbstractControl): ValidationErrors | null {
    const password = grupo.get('password')?.value;
    const confirmar = grupo.get('confirmarPassword')?.value;
    return password === confirmar ? null : { noCoinciden: true };
}

// Pasa a minúsculas y quita tildes, para que "Perez" encuentre "Pérez"
function normalizar(texto: string): string {
    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

@Component({
    imports: [ReactiveFormsModule, TitleCasePipe],
    selector: 'app-gestion-usuario',
    styleUrl: './gestion-usuario.css',
    templateUrl: './gestion-usuario.html',
})
export class GestionUsuario implements OnInit {
    formularioRegistroNuevoUsuario!: FormGroup;

    mostrarFormulario = false;
    roles: Rol[] = [];
    areas: Area[] = [];
    mensajeExito = '';
    erroresServidor: string[] = [];

    // Listado
    usuarios: UsuarioListado[] = [];
    usuariosFiltrados: UsuarioListado[] = [];
    terminoBusqueda = '';
    errorListado = '';

    // Hardcodeado
    accionesTabla = [
        { icono: 'bi bi-pencil-fill' },
        { icono: 'bi bi-trash-fill' },
    ];

    constructor(
        private formRegistroNuevoUsuario: FormBuilder,
        private usuarioService: UsuarioService,
        private cdr: ChangeDetectorRef
    ) {
        this.formularioRegistroNuevoUsuario = this.formRegistroNuevoUsuario.group(
            {
                nombre: ['', [Validators.required, Validators.maxLength(50)]],
                email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
                rol: ['', Validators.required],
                area: ['', Validators.required],
                password: [
                    '',
                    [
                        Validators.required,
                        Validators.minLength(8),
                        // al menos una minúscula, una mayúscula y un número
                        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
                    ],
                ],
                confirmarPassword: ['', Validators.required],
            },
            { validators: passwordsIguales }
        );
    }

    ngOnInit(): void {
        this.usuarioService.obtenerRoles().subscribe({
            next: (roles) => (this.roles = roles),
            error: (error) => console.error('Error al cargar roles:', error),
            complete: () => {
                this.cdr.detectChanges();
                console.info('complete');
            },
        });

        this.usuarioService.obtenerAreas().subscribe({
            next: (areas) => (this.areas = areas),
            error: (error) => console.error('Error al cargar áreas:', error),
            complete: () => {
                this.cdr.detectChanges();
                console.info('complete');
            },
        });

        this.cargarUsuarios();
    }

    cargarUsuarios(): void {
        this.errorListado = '';
        this.usuarioService.obtenerUsuarios().subscribe({
            next: (usuarios) => {
                this.usuarios = usuarios;
                this.aplicarFiltro();
            },
            error: (error: Error) => {
                console.error('Error al cargar usuarios:', error);
                this.errorListado = 'No se pudieron cargar los usuarios.';
            },
            complete: () => {
                this.cdr.detectChanges();
                console.info('complete');
            },
        });
    }

    // Filtra sobre lo ya cargado, sin volver a pedir datos al backend
    buscarUsuario(termino: string): void {
        this.terminoBusqueda = termino;
        this.aplicarFiltro();
    }

    private aplicarFiltro(): void {
        const termino = normalizar(this.terminoBusqueda);

        if (!termino) {
            this.usuariosFiltrados = [...this.usuarios];
            return;
        }

        this.usuariosFiltrados = this.usuarios.filter((u) =>
            [
                String(u.idUsuario),
                u.nombreUsuario,
                u.emailUsuario,
                u.nombreRol,
                u.nombreArea,
            ].some((campo) => normalizar(campo).includes(termino))
        );
    }

    // Por ahora solo identifica la acción; la lógica llega en las HU de editar y eliminar
    ejecutarAccion(icono: string, usuario: UsuarioListado): void {
        switch (icono) {
            case 'bi bi-pencil-fill':
                console.log('Modificar usuario:', usuario);
                break;
            case 'bi bi-trash-fill':
                console.log('Eliminar usuario:', usuario);
                break;
        }
    }

    alternarFormulario(): void {
        this.mostrarFormulario = !this.mostrarFormulario;
        this.mensajeExito = '';
        this.erroresServidor = [];
    }

    registrarNuevoUsuario(): void {
        if (this.formularioRegistroNuevoUsuario.invalid) {
            this.formularioRegistroNuevoUsuario.markAllAsTouched();
            return;
        }

        this.erroresServidor = [];

        const nuevoUsuario = {
            nombreUsuario: this.Nombre?.value,
            idRol: this.Rol?.value,
            idArea: this.Area?.value,
            emailUsuario: this.Email?.value,
            password: this.Password?.value,
        };

        this.usuarioService.registro(nuevoUsuario).subscribe({
            next: (respuesta) => {
                this.mensajeExito = respuesta.mensaje;
                this.formularioRegistroNuevoUsuario.reset();
                this.mostrarFormulario = false;
                this.cargarUsuarios(); // refresca la tabla con el usuario nuevo
            },
            error: (error: HttpErrorResponse | Error) => {
                if (error instanceof HttpErrorResponse) {
                    // Django devuelve { campo: ["mensaje", ...] } al fallar una validación
                    this.erroresServidor = Object.values(error.error).flat().map(String);
                } else {
                    this.erroresServidor = [error.message];
                }
            },
            complete: () => {
                this.cdr.detectChanges();
                console.info('complete');
            },
        });
    }

    get Nombre() {
        return this.formularioRegistroNuevoUsuario.get('nombre');
    }
    get Email() {
        return this.formularioRegistroNuevoUsuario.get('email');
    }
    get Rol() {
        return this.formularioRegistroNuevoUsuario.get('rol');
    }
    get Area() {
        return this.formularioRegistroNuevoUsuario.get('area');
    }
    get Password() {
        return this.formularioRegistroNuevoUsuario.get('password');
    }
    get ConfirmarPassword() {
        return this.formularioRegistroNuevoUsuario.get('confirmarPassword');
    }
}