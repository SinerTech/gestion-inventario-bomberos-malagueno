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
import { UsuarioService } from '../../../../services/usuario/usuario-service';
import { Rol } from '../../../../models/rol.models';
import { Area } from '../../../../models/area.models';
import { UsuarioListado } from '../../../../models/usuario-listado.models';
import { TitleCasePipe } from '@angular/common';
import { UsuarioEditado } from '../../../../models/usuario-editado.models';
import { ContenidoService } from '../../../../services/contenido/contenido-service';
import { AccionTabla } from '../../../../models/contenido.models';

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
    mostrarFormulario = false;
    modoEdicion = false;
    idUsuarioEditar: number | null = null;
    roles: Rol[] = [];
    areas: Area[] = [];
    mensajeExito = '';
    erroresServidor: string[] = [];
    accionesTabla: AccionTabla[] = []; 

    // Listado
    usuarios: UsuarioListado[] = [];
    usuariosFiltrados: UsuarioListado[] = [];
    terminoBusqueda = '';
    errorListado = '';

    private fb = inject(FormBuilder);
    private usuarioService = inject(UsuarioService);
    private cdr = inject(ChangeDetectorRef);
    private contenidoService = inject(ContenidoService);
    
    private readonly validadoresPassword = [
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
    ];

    formularioRegistroNuevoUsuario: FormGroup = this.fb.group(
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
            activo: [true],
        },
        { validators: passwordsIguales }
    );

    ngOnInit(): void {
        this.usuarioService.obtenerRoles().subscribe({
            next: (roles) => {
                (this.roles = roles); 
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error al cargar roles:', error); 
                this.cdr.detectChanges();
            },
            complete: () => {
                this.cdr.detectChanges();
            },
        });

        this.usuarioService.obtenerAreas().subscribe({
            next: (areas) => {
                (this.areas = areas);
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error al cargar áreas:', error);
                this.cdr.detectChanges();
            },
            complete: () => {
                this.cdr.detectChanges();
            },
        });

        this.cargarUsuarios();

        this.contenidoService.obtenerDashboard('administrador').subscribe({
            next: (dashboard) => {
                this.accionesTabla = dashboard.accionesTabla;
                this.cdr.detectChanges();
            },
            error: (error) => console.error('Error al cargar las acciones:', error),
        });
    }

    cargarUsuarios(): void {
        this.errorListado = '';
        this.usuarioService.obtenerUsuarios().subscribe({
            next: (usuarios) => {
                this.usuarios = usuarios;
                this.aplicarFiltro();
                this.cdr.detectChanges();
            },
            error: (error: Error) => {
                console.error('Error al cargar usuarios:', error);
                this.errorListado = 'No se pudieron cargar los usuarios.';
                this.cdr.detectChanges();
            },
            complete: () => {
                this.cdr.detectChanges();
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

    ejecutarAccion(idAccion: string, usuario: UsuarioListado): void {
        switch (idAccion) {
            case 'editar':
                this.iniciarEdicion(usuario);
                break;
            case 'eliminar':
                this.darDeBaja(usuario);
                break;
        }
    }

    alternarFormulario(): void {
        if (this.mostrarFormulario) {
            this.cerrarFormulario(); // cancelar: vuelve al estado inicial
        } else {
            this.mostrarFormulario = true;
        }
        this.mensajeExito = '';
        this.erroresServidor = [];
    }

    guardarUsuario(): void {
        if (this.formularioRegistroNuevoUsuario.invalid) {
            this.formularioRegistroNuevoUsuario.markAllAsTouched();
            return;
        }
        this.mensajeExito = '';
        this.erroresServidor = [];

        if (this.modoEdicion) {
            this.modificarUsuario();
        } else {
            this.registrarNuevoUsuario();
        }
    }

    private registrarNuevoUsuario(): void {
        const nuevoUsuario = {
            nombreUsuario: this.Nombre?.value,
            idRol: this.Rol?.value,
            idArea: this.Area?.value,
            emailUsuario: this.Email?.value,
            password: this.Password?.value,
        };

        this.usuarioService.registro(nuevoUsuario).subscribe({
            next: (respuesta) => this.finalizarOperacion(respuesta.mensaje),
            error: (error: HttpErrorResponse | Error) => this.mostrarErrores(error),
        });
    }

    private modificarUsuario(): void {
        if (this.idUsuarioEditar === null) return;

        const usuario: UsuarioEditado = {
            nombreUsuario: this.Nombre?.value,
            emailUsuario: this.Email?.value,
            idRol: this.Rol?.value,
            idArea: this.Area?.value,
            activo: this.Activo?.value,
        };

        // La contraseña solo viaja si el administrador escribió una nueva
        if (this.Password?.value) {
            usuario.password = this.Password.value;
        }

        this.usuarioService.modificar(this.idUsuarioEditar, usuario).subscribe({
            next: (respuesta) => this.finalizarOperacion(respuesta.mensaje),
            error: (error: HttpErrorResponse | Error) => this.mostrarErrores(error),
        });
    }

    private finalizarOperacion(mensaje: string): void {
        this.mensajeExito = mensaje;
        this.cerrarFormulario();
        this.cargarUsuarios(); // refresca la tabla
        this.cdr.detectChanges();
    }

    private mostrarErrores(error: HttpErrorResponse | Error): void {
        if (error instanceof HttpErrorResponse) {
            // Django devuelve { campo: ["mensaje", ...] } al fallar una validación
            this.erroresServidor = Object.values(error.error).flat().map(String);
        } else {
            this.erroresServidor = [error.message];
        }
        this.cdr.detectChanges();
    }

    private cerrarFormulario(): void {
        this.mostrarFormulario = false;
        this.modoEdicion = false;
        this.idUsuarioEditar = null;
        this.configurarPasswordObligatoria(true); // vuelve al modo alta
        this.formularioRegistroNuevoUsuario.reset({ rol: '', area: '', activo: true });
    }

    // Cambia los validadores de la contraseña según el modo (alta u edición)
    private configurarPasswordObligatoria(obligatoria: boolean): void {
        const validadores = obligatoria
            ? [Validators.required, ...this.validadoresPassword]
            : this.validadoresPassword;

        this.Password?.setValidators(validadores);
        this.ConfirmarPassword?.setValidators(obligatoria ? [Validators.required] : []);
        this.Password?.updateValueAndValidity();
        this.ConfirmarPassword?.updateValueAndValidity();
    }

    private irAlFormulario(): void {
        setTimeout(() => {
            document
                .getElementById('formulario_usuario')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    iniciarEdicion(usuario: UsuarioListado): void {
        this.modoEdicion = true;
        this.idUsuarioEditar = usuario.idUsuario;
        this.mostrarFormulario = true;
        this.mensajeExito = '';
        this.erroresServidor = [];

        this.configurarPasswordObligatoria(false);

        // reset con valores: carga los datos y limpia los estados "tocado"
        this.formularioRegistroNuevoUsuario.reset({
            nombre: usuario.nombreUsuario,
            email: usuario.emailUsuario,
            rol: usuario.idRol,
            area: usuario.idArea,
            password: '',
            confirmarPassword: '',
            activo: usuario.activo,
        });

        this.cdr.detectChanges();
        this.irAlFormulario();
    }

    darDeBaja(usuario: UsuarioListado): void {
        if (!usuario.activo) {
            this.mensajeExito = '';
            this.erroresServidor = [];
            this.errorListado = `${usuario.nombreUsuario} ya está dado de baja.`;
            return;
        }

        const confirmado = confirm(
            `¿Dar de baja a ${usuario.nombreUsuario}? Podrá reactivarse más adelante.`
        );
        if (!confirmado) return;

        this.errorListado = '';
        this.usuarioService.darDeBaja(usuario.idUsuario).subscribe({
            next: (respuesta) => {
                this.mensajeExito = respuesta.mensaje;
                this.cargarUsuarios();
                this.cdr.detectChanges();
            },
            error: (error: Error) => {
                this.errorListado = error.message;
                this.cdr.detectChanges();
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
    get Activo() {
        return this.formularioRegistroNuevoUsuario.get('activo');
    }
}