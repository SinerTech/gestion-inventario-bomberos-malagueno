import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { Motivo } from '../../models/motivo.models';
import { NuevoIngreso, ResultadoIngreso } from '../../models/ingreso.models';
import { NuevoRetiro, ResultadoRetiro } from '../../models/retiro.models';
import { NuevaDevolucion, ResultadoDevolucion } from '../../models/devolucion.models';

// Formas que usa Django (snake_case). Solo se usan dentro de este servicio.
interface MotivoApi {
    id_motivo: number;
    nombre_motivo: string;
}

interface IngresoRespuestaApi {
    mensaje: string;
    unidades: { id_unidad_recurso: number; codigo_interno: string }[];
}

@Injectable({
    providedIn: 'root',
})
export class MovimientoInventarioService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'http://localhost:8000/api';

    obtenerMotivos(tipo?: string): Observable<Motivo[]> {
        let params = new HttpParams();
        if (tipo) params = params.set('tipo', tipo);

        return this.http.get<MotivoApi[]>(`${this.apiUrl}/motivos/`, { params }).pipe(
            map((motivos) =>
                motivos.map((m) => ({ idMotivo: m.id_motivo, nombreMotivo: m.nombre_motivo }))
            ),
            catchError(this.handleError)
        );
    }

    registrarIngreso(ingreso: NuevoIngreso): Observable<ResultadoIngreso> {
        // Traducción de camelCase (Angular) a snake_case (Django)
        const body = {
            id_recurso: ingreso.idRecurso,
            cantidad: ingreso.cantidad,
            id_proveedor: ingreso.idProveedor,
            id_motivo: ingreso.idMotivo,
            numero_lote_factura: ingreso.numeroLoteFactura,
            id_usuario_registra: ingreso.idUsuarioRegistra,
            medida: ingreso.medida,
            marca: ingreso.marca,
            valor: ingreso.valor,
            fondo: ingreso.fondo,
            estado: ingreso.estado,
            observaciones: ingreso.observaciones,
        };

        return this.http.post<IngresoRespuestaApi>(`${this.apiUrl}/ingresos/`, body).pipe(
            map((respuesta) => ({
                mensaje: respuesta.mensaje,
                codigos: respuesta.unidades.map((u) => u.codigo_interno),
            })),
            catchError(this.handleError)
        );
    }

    registrarRetiro(retiro: NuevoRetiro): Observable<ResultadoRetiro> {
        const body = {
            id_usuario_retira: retiro.idUsuarioRetira,
            id_usuario_registra: retiro.idUsuarioRegistra,
            id_motivo: retiro.idMotivo,
            observaciones: retiro.observaciones,
            unidades: retiro.unidades.map((u) => ({
                id_unidad_recurso: u.idUnidadRecurso,
                estado_al_retirar: u.estadoAlRetirar,
            })),
        };

        return this.http.post<IngresoRespuestaApi>(`${this.apiUrl}/retiros/`, body).pipe(
            map((respuesta) => ({
                mensaje: respuesta.mensaje,
                codigos: respuesta.unidades.map((u) => u.codigo_interno),
            })),
            catchError(this.handleError)
        );
    }

    registrarDevolucion(devolucion: NuevaDevolucion): Observable<ResultadoDevolucion> {
        const body = {
            id_usuario_devuelve: devolucion.idUsuarioDevuelve,
            id_usuario_registra: devolucion.idUsuarioRegistra,
            observaciones: devolucion.observaciones,
            unidades: devolucion.unidades.map((u) => ({
                id_unidad_recurso: u.idUnidadRecurso,
                estado_al_devolver: u.estadoAlDevolver,
            })),
        };

        return this.http.post<IngresoRespuestaApi>(`${this.apiUrl}/devoluciones/`, body).pipe(
            map((respuesta) => ({
                mensaje: respuesta.mensaje,
                codigos: respuesta.unidades.map((u) => u.codigo_interno),
            })),
            catchError(this.handleError)
        );
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
