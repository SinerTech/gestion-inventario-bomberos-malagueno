import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { Proveedor } from '../../models/proveedor.models';

// Forma que usa Django (snake_case). Solo se usa dentro de este servicio.
interface ProveedorApi {
    id_proveedor: number;
    razon_social: string;
    cuit: string;
    telefono_proveedor: string | null;
    email_proveedor: string | null;
}

interface ModificarProveedorRespuesta {
    mensaje: string;
    proveedor: ProveedorApi;
}


export interface RegistroProveedorRespuesta {
    mensaje: string;
    proveedor: ProveedorApi;
}

@Injectable({
    providedIn: 'root',
})
export class ProveedorService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'http://localhost:8000/api';

    obtenerProveedores(): Observable<Proveedor[]> {
        return this.http.get<ProveedorApi[]>(`${this.apiUrl}/proveedores/`).pipe(
            map((proveedores) =>
                proveedores.map((p) => ({
                    idProveedor: p.id_proveedor,
                    razonSocial: p.razon_social,
                    cuit: p.cuit,
                    telefonoProveedor: p.telefono_proveedor,
                    emailProveedor: p.email_proveedor
                }))
            ),
            catchError(this.handleError)
        );
    }

    registrarProveedor(nuevoProveedor: Omit<Proveedor, 'idProveedor'>): Observable<RegistroProveedorRespuesta> {
        // Traducción de camelCase (Angular) a snake_case (Django)
        const body = {
            razon_social: nuevoProveedor.razonSocial,
            cuit: nuevoProveedor.cuit,
            telefono_proveedor: nuevoProveedor.telefonoProveedor,
            email_proveedor: nuevoProveedor.emailProveedor,
        }
        return this.http.post<RegistroProveedorRespuesta>(`${this.apiUrl}/proveedores/`, body).pipe(
            catchError(this.handleError)
        );
    }

    modificar(idProveedor: number, proveedor: Omit<Proveedor, 'idProveedor'>): Observable<ModificarProveedorRespuesta> {
        const body = {
            razon_social: proveedor.razonSocial,
            cuit: proveedor.cuit,
            telefono_proveedor: proveedor.telefonoProveedor,
            email_proveedor: proveedor.emailProveedor,
        };
        return this.http
            .put<ModificarProveedorRespuesta>(`${this.apiUrl}/proveedores/${idProveedor}/`, body)
            .pipe(catchError(this.handleError));
    }

    private handleError(error: HttpErrorResponse) {
        // Los 400 son errores de validación de Django (CUIT duplicado,
        // email inválido, etc.): se dejan pasar para mostrarlos en pantalla
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
