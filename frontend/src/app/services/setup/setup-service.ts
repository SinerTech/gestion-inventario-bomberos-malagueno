import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, shareReplay, tap, throwError } from 'rxjs';

export interface NuevoAdministrador {
    nombreUsuario: string;
    emailUsuario: string;
    password: string;
}

@Injectable({
    providedIn: 'root',
})
export class SetupService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'http://localhost:8000/api';

    // Se consulta una vez y se reutiliza. Una vez creado el administrador no vuelve a cambiar
    private estado$?: Observable<boolean>;

    requiereSetup(): Observable<boolean> {
        if (!this.estado$) {
            this.estado$ = this.http
                .get<{ requiere_setup: boolean }>(`${this.apiUrl}/setup/estado/`)
                .pipe(
                    map((r) => r.requiere_setup),
                    shareReplay(1),
                    catchError((error) => {
                        this.estado$ = undefined; // si falla, se reintenta la próxima vez
                        return this.handleError(error);
                    })
                );
        }
        return this.estado$;
    }

    registrarAdministrador(admin: NuevoAdministrador): Observable<{ mensaje: string }> {
        const body = {
            nombre_usuario: admin.nombreUsuario,
            email_usuario: admin.emailUsuario,
            password: admin.password,
        };
        return this.http
            .post<{ mensaje: string }>(`${this.apiUrl}/setup/administrador/`, body)
            .pipe(
                tap(() => (this.estado$ = undefined)), // se vuelve a consultar: ahora será false
                catchError(this.handleError)
            );
    }

    private handleError(error: HttpErrorResponse) {
        // 400 (validación) y 403 (ya realizado) traen un mensaje del servidor
        if ((error.status === 400 || error.status === 403) && typeof error.error === 'object') {
            return throwError(() => error);
        }
        if (error.status === 0) {
            console.error('No se pudo conectar con el servidor:', error.error);
        } else {
            console.error(`El backend devolvió el código ${error.status}:`, error.error);
        }
        return throwError(() => new Error('Ocurrió un error. Intente nuevamente más tarde.'));
    }
}
