import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { Usuario } from '../../models/usuario.models';

interface RespuestaLogin {
    usuario: {
        id_usuario: number;
        nombre_usuario: string;
        email_usuario: string;
        id_rol: number;
        id_area: number;
        rol: {
        id_rol: number;
        nombre_rol: string;
        };
        area: {
        id_area: number;
        nombre_area: string;
        };
        activo: boolean;
    };
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'http://localhost:8000/api';

    login(email: string, password: string): Observable<Usuario> {
        return this.http.post<RespuestaLogin>(`${this.apiUrl}/login/`, {email, password,}).pipe(
            map(({ usuario }) => ({
                idUsuario: usuario.id_usuario,
                nombreUsuario: usuario.nombre_usuario,
                emailUsuario: usuario.email_usuario,
                idRol: usuario.id_rol,
                idArea: usuario.id_area,
                activo: usuario.activo,
                rol: usuario.rol,
                area: usuario.area,
            })),
            catchError(this.handleError)
        );
    }

    obtenerUsuarioActual(): Usuario | null {
        const usuario = localStorage.getItem('usuario_actual');
        if (!usuario) {
            return null;
        }
            return JSON.parse(usuario) as Usuario;
        }

    estaLogueado(): boolean {
        return this.obtenerUsuarioActual() !== null;
    }

    obtenerRutaDashboard(usuario: Usuario): string {
        switch (usuario.idRol) {
        case 1:
            return 'bomberos-malagueno/dashboard-admin';
        case 2:
            return 'bomberos-malagueno/dashboard-supervisor';
        case 3:
            return 'bomberos-malagueno/dashboard-operativo';
        default:
            return '/';
        }
    }

    private handleError(error: HttpErrorResponse) {
        if (error.status === 0) {
            console.error('Error de conexión con el servidor:', error.message);
        } else {
            console.error(
                `Error HTTP ${error.status}:`,
                error.error
            );
        }
        return throwError(() => error);
    }
}
