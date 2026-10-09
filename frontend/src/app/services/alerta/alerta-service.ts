import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { Alerta, NuevaNovedad } from '../../models/alerta.models';

// Forma que usa Django (snake_case). Solo se usa dentro de este servicio.
interface AlertaApi {
    id_alerta: number;
    id_unidad_recurso: number;
    codigo_interno: string;
    nombre_recurso: string;
    tipo: string;
    descripcion: string;
    estado_alerta: string;
    fecha_generada: string;
}

@Injectable({
    providedIn: 'root',
})
export class AlertaService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'http://localhost:8000/api';

    obtenerAlertas(
        filtros: { idUsuarioReporta?: number; estadoAlerta?: string } = {}
    ): Observable<Alerta[]> {
        let params = new HttpParams();
        if (filtros.idUsuarioReporta !== undefined) {
            params = params.set('id_usuario_reporta', filtros.idUsuarioReporta);
        }
        if (filtros.estadoAlerta) params = params.set('estado_alerta', filtros.estadoAlerta);

        return this.http.get<AlertaApi[]>(`${this.apiUrl}/alertas/`, { params }).pipe(
            map((alertas) => alertas.map((a) => this.aAlerta(a))),
            catchError(this.handleError)
        );
    }

    registrarNovedad(novedad: NuevaNovedad): Observable<{ mensaje: string }> {
        const body = {
            id_unidad_recurso: novedad.idUnidadRecurso,
            id_usuario_reporta: novedad.idUsuarioReporta,
            tipo: novedad.tipo,
            descripcion: novedad.descripcion,
        };
        return this.http
            .post<{ mensaje: string }>(`${this.apiUrl}/alertas/`, body)
            .pipe(catchError(this.handleError));
    }

    private aAlerta(a: AlertaApi): Alerta {
        return {
            idAlerta: a.id_alerta,
            idUnidadRecurso: a.id_unidad_recurso,
            codigoInterno: a.codigo_interno,
            nombreRecurso: a.nombre_recurso,
            tipo: a.tipo,
            descripcion: a.descripcion,
            estadoAlerta: a.estado_alerta,
            fechaGenerada: a.fecha_generada,
        };
    }

    private handleError(error: HttpErrorResponse) {
        // 400 (validación) y 409 (conflicto) traen un mensaje útil del servidor
        if ((error.status === 400 || error.status === 409) && typeof error.error === 'object') {
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
