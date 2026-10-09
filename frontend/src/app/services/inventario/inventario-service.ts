import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { ResumenRecurso } from '../../models/resumen-recurso.models';
import { UnidadRecurso } from '../../models/unidad-recurso.models';

// Formas que usa Django (snake_case). Solo se usan dentro de este servicio.
interface ResumenRecursoApi {
    id_recurso: number;
    nombre_recurso: string;
    categoria: { id_categoria: number; nombre_categoria: string };
    total_unidades: number;
    disponibles: number;
    en_uso: number;
    de_baja: number;
    no_operativas: number;
}

interface UnidadRecursoApi {
    id_unidad_recurso: number;
    codigo_interno: string;
    id_recurso: number;
    nombre_recurso: string;
    nombre_categoria: string;
    medida: string | null;
    marca: string | null;
    numero_serie_fabricante: string | null;
    fecha_alta: string;
    valor: string | null; // DRF envía los decimales como texto
    fondo: string;
    id_proveedor: number;
    razon_social: string;
    estado: string;
    disponibilidad: string;
    id_usuario_asignado: number | null;
    nombre_usuario_asignado: string | null;
    observaciones: string | null;
}

@Injectable({
    providedIn: 'root',
})
export class InventarioService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'http://localhost:8000/api';

    obtenerResumen(): Observable<ResumenRecurso[]> {
        return this.http.get<ResumenRecursoApi[]>(`${this.apiUrl}/inventario/resumen/`).pipe(
            map((recursos) =>
                recursos.map((r) => ({
                    idRecurso: r.id_recurso,
                    nombreRecurso: r.nombre_recurso,
                    nombreCategoria: r.categoria.nombre_categoria,
                    totalUnidades: r.total_unidades,
                    disponibles: r.disponibles,
                    enUso: r.en_uso,
                    deBaja: r.de_baja,
                    noOperativas: r.no_operativas,
                }))
            ),
            catchError(this.handleError)
        );
    }

    obtenerUnidades(
        filtros: { idRecurso?: number; disponibilidad?: string; idUsuarioAsignado?: number } = {}
    ): Observable<UnidadRecurso[]> {
        let params = new HttpParams();
        if (filtros.idRecurso !== undefined) params = params.set('id_recurso', filtros.idRecurso);
        if (filtros.disponibilidad) params = params.set('disponibilidad', filtros.disponibilidad);
        if (filtros.idUsuarioAsignado !== undefined) {
            params = params.set('id_usuario_asignado', filtros.idUsuarioAsignado);
        }

        return this.http.get<UnidadRecursoApi[]>(`${this.apiUrl}/unidades/`, { params }).pipe(
            map((unidades) =>
                unidades.map((u) => ({
                    idUnidadRecurso: u.id_unidad_recurso,
                    codigoInterno: u.codigo_interno,
                    idRecurso: u.id_recurso,
                    nombreRecurso: u.nombre_recurso,
                    nombreCategoria: u.nombre_categoria,
                    medida: u.medida,
                    marca: u.marca,
                    numeroSerieFabricante: u.numero_serie_fabricante,
                    fechaAlta: u.fecha_alta,
                    valor: u.valor !== null ? Number(u.valor) : null,
                    fondo: u.fondo,
                    idProveedor: u.id_proveedor,
                    razonSocial: u.razon_social,
                    estado: u.estado,
                    disponibilidad: u.disponibilidad,
                    idUsuarioAsignado: u.id_usuario_asignado,
                    nombreUsuarioAsignado: u.nombre_usuario_asignado,
                    observaciones: u.observaciones,
                }))
            ),
            catchError(this.handleError)
        );
    }

    private handleError(error: HttpErrorResponse) {
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
