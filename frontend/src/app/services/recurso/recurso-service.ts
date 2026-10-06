import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { Recurso } from '../../models/recurso.models';
import { Categoria } from '../../models/categoria.models';
import { TipoMaterial } from '../../models/tipo-material.models';

// Formas que usa Django (snake_case). Solo se usan dentro de este servicio.
interface CategoriaApi {
    id_categoria: number;
    nombre_categoria: string;
}

interface TipoMaterialApi {
    id_tipo_material: number;
    nombre_tipo_material: string;
}

interface RecursoApi {
    id_recurso: number;
    nombre_recurso: string;
    id_categoria: number;
    categoria: CategoriaApi;
    tipos_material: TipoMaterialApi[];
}

interface RegistroRecursoRespuesta {
    mensaje: string;
    recurso: RecursoApi;
}

interface NuevoRecurso {
    nombreRecurso: string;
    idCategoria: number;
    idsTipoMaterial: number[];
}

interface ModificarRecursoRespuesta {
    mensaje: string;
    recurso: RecursoApi;
}

@Injectable({
    providedIn: 'root',
})
export class RecursoService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'http://localhost:8000/api';

    obtenerCategorias(): Observable<Categoria[]> {
        return this.http.get<CategoriaApi[]>(`${this.apiUrl}/categorias/`).pipe(
            map((categorias) =>
                categorias.map((c) => ({
                    idCategoria: c.id_categoria,
                    nombreCategoria: c.nombre_categoria,
                }))
            ),
            catchError(this.handleError)
        );
    }

    obtenerTiposMaterial(): Observable<TipoMaterial[]> {
        return this.http.get<TipoMaterialApi[]>(`${this.apiUrl}/tipos-material/`).pipe(
            map((tipos) =>
                tipos.map((t) => ({
                    idTipoMaterial: t.id_tipo_material,
                    nombreTipoMaterial: t.nombre_tipo_material,
                }))
            ),
            catchError(this.handleError)
        );
    }

    obtenerRecursos(): Observable<Recurso[]> {
        return this.http.get<RecursoApi[]>(`${this.apiUrl}/recursos/`).pipe(
            map((recursos) =>
                recursos.map((r) => ({
                    idRecurso: r.id_recurso,
                    nombreRecurso: r.nombre_recurso,
                    idCategoria: r.id_categoria,
                    nombreCategoria: r.categoria.nombre_categoria,
                    tiposMaterial: r.tipos_material.map((t) => ({
                        idTipoMaterial: t.id_tipo_material,
                        nombreTipoMaterial: t.nombre_tipo_material,
                    })),
                }))
            ),
            catchError(this.handleError)
        );
    }

    registro(nuevoRecurso: NuevoRecurso): Observable<RegistroRecursoRespuesta> {
        // Traducción de camelCase (Angular) a snake_case (Django)
        const body = {
            nombre_recurso: nuevoRecurso.nombreRecurso,
            id_categoria: nuevoRecurso.idCategoria,
            ids_tipo_material: nuevoRecurso.idsTipoMaterial,
        };
        return this.http.post<RegistroRecursoRespuesta>(`${this.apiUrl}/recursos/`, body).pipe(
            catchError(this.handleError)
        );
    }

    modificar(idRecurso: number, recurso: NuevoRecurso): Observable<ModificarRecursoRespuesta> {
    const body = {
        nombre_recurso: recurso.nombreRecurso,
        id_categoria: recurso.idCategoria,
        ids_tipo_material: recurso.idsTipoMaterial,
    };
    return this.http.put<ModificarRecursoRespuesta>(`${this.apiUrl}/recursos/${idRecurso}/`, body).pipe(
        catchError(this.handleError)
        );
    }

    eliminar(idRecurso: number): Observable<{ mensaje: string }> {
        return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/recursos/${idRecurso}/`).pipe(
            catchError(this.handleError)
        );
    }
    
    private handleError(error: HttpErrorResponse) {
        // 400: errores de validación de Django (duplicado, categoría inexistente, etc.)
        // 409: errores de conflicto (ej. recurso con unidades asociadas).
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
