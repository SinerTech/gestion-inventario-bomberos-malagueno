import { Injectable } from '@angular/core';
import { Observable, of, map, throwError } from 'rxjs';
import contenidoJson from '../../data/contenido.json'; // ajustá la ruta
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
    private readonly contenido = contenidoJson as Contenido;

    obtenerLanding(): Observable<LandingContenido> {
        return of(this.contenido).pipe(map((c) => c.landing));
    }

    obtenerQuienesSomos(): Observable<QuienesSomosContenido> {
        return of(this.contenido).pipe(map((c) => c.quienesSomos));
    }

    obtenerDashboard(clave: string): Observable<DashboardContenido> {
        const dashboard = this.contenido.dashboards[clave];
        return dashboard
            ? of(dashboard)
            : throwError(() => new Error(`No existe el dashboard "${clave}"`));
    }
}