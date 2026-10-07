import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { Motivo } from '../../models/motivo.models';
import { NuevoIngreso, ResultadoIngreso } from '../../models/ingreso.models';

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

    obtenerMotivos(): Observable<Motivo[]> {
        return this.http.get<MotivoApi[]>(`${this.apiUrl}/motivos/`).pipe(
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

    private handleError(error: HttpErrorResponse) {
        // Los 400 son errores de validación de Django: se dejan pasar para mostrarlos
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
