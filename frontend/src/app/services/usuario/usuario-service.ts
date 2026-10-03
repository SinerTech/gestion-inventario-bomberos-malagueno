import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { Usuario } from '../../models/usuario.models';
import { Rol } from '../../models/rol.models';
import { Area } from '../../models/area.models';
import { UsuarioListado } from '../../models/usuario-listado.models';

// Formas que usa Django (snake_case). Solo se usan dentro de este servicio.
interface RolApi {
    id_rol: number;
    nombre_rol: string;
}

interface AreaApi {
    id_area: number;
    nombre_area: string;
}

interface UsuarioApi {
    id_usuario: number;
    nombre_usuario: string;
    email_usuario: string;
    id_rol: number;
    id_area: number;
    rol: RolApi;
    area: AreaApi;
    activo: boolean;
}

export interface RegistroUsuarioRespuesta {
    mensaje: string;
    usuario: UsuarioApi;
}

@Injectable({
    providedIn: 'root',
})
export class UsuarioService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'http://localhost:8000/api';

    obtenerRoles(): Observable<Rol[]> {
        return this.http.get<RolApi[]>(`${this.apiUrl}/roles/`).pipe(
            map((roles) =>
                roles.map((r) => ({ idRol: r.id_rol, nombreRol: r.nombre_rol }))
            ),
            catchError(this.handleError)
        );
    }

    obtenerAreas(): Observable<Area[]> {
        return this.http.get<AreaApi[]>(`${this.apiUrl}/areas/`).pipe(
            map((areas) =>
                areas.map((a) => ({ idArea: a.id_area, nombreArea: a.nombre_area }))
            ),
            catchError(this.handleError)
        );
    }

    obtenerUsuarios(): Observable<UsuarioListado[]> {
        return this.http.get<UsuarioApi[]>(`${this.apiUrl}/usuarios/`).pipe(
            map((usuarios) =>
                usuarios.map((u) => ({
                    idUsuario: u.id_usuario,
                    nombreUsuario: u.nombre_usuario,
                    emailUsuario: u.email_usuario,
                    idRol: u.id_rol,
                    idArea: u.id_area,
                    nombreRol: u.rol.nombre_rol,
                    nombreArea: u.area.nombre_area,
                    activo: u.activo,
                }))
            ),
            catchError(this.handleError)
        );
    }

    // 'activo' no se envía: el backend lo deja en true por defecto
    registro(
        nuevoUsuario: Omit<Usuario, 'idUsuario' | 'activo'>
    ): Observable<RegistroUsuarioRespuesta> {
        // Traducción de camelCase (Angular) a snake_case (Django)
        const body = {
            nombre_usuario: nuevoUsuario.nombreUsuario,
            email_usuario: nuevoUsuario.emailUsuario,
            password: nuevoUsuario.password,
            id_rol: nuevoUsuario.idRol,
            id_area: nuevoUsuario.idArea,
        };
        return this.http
            .post<RegistroUsuarioRespuesta>(`${this.apiUrl}/usuarios/`, body)
            .pipe(catchError(this.handleError));
    }

    private handleError(error: HttpErrorResponse) {
        // Los 400 son errores de validación de Django (email duplicado,
        // contraseña débil, etc.): se dejan pasar para mostrarlos en pantalla
        if (error.status === 400 && typeof error.error === 'object') {
            return throwError(() => error);
        }
        if (error.status === 0) {
            console.error('No se pudo conectar con el servidor:', error.error);
        } else {
            console.error(`El backend devolvió el código ${error.status}:`, error.error);
        }
        return throwError(
            () => new Error('Ocurrió un error. Intente nuevamente más tarde.')
        );
    }
}