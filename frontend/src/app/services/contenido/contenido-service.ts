import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, shareReplay, throwError } from 'rxjs';
import {
    Contenido,
    DashboardContenido,
    LandingContenido,
    QuienesSomosContenido,
} from '../../models/contenido.models';

@Injectable({
    providedIn: 'root',
})
export class ContenidoService {
    private readonly http = inject(HttpClient);
    private readonly url = '/data/contenido.json';

    // Se descarga una sola vez y se reutiliza en todas las pantallas
    private readonly contenido$: Observable<Contenido> = this.http
        .get<Contenido>(this.url)
        .pipe(catchError(this.handleError), shareReplay(1));

    obtenerLanding(): Observable<LandingContenido> {
        return this.contenido$.pipe(map((c) => c.landing));
    }

    obtenerQuienesSomos(): Observable<QuienesSomosContenido> {
        return this.contenido$.pipe(map((c) => c.quienesSomos));
    }

    // clave: 'administrador' | 'responsable' | 'operativo'
    obtenerDashboard(clave: string): Observable<DashboardContenido> {
        return this.contenido$.pipe(map((c) => c.dashboards[clave]));
    }

    private handleError(error: HttpErrorResponse) {
        console.error(`No se pudo cargar el contenido (${error.status}):`, error.error);
        return throwError(
            () => new Error('Ocurrió un error. Intente nuevamente más tarde.')
        );
    }
}
