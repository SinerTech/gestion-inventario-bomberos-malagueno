import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth-service';

export const authGuard: CanActivateFn = (route) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const usuario = authService.obtenerUsuarioActual();

    if (!usuario) {
        return router.parseUrl('/login');
    }

    const rolesPermitidos = route.data['rolesPermitidos'] as string[] | undefined;

    // Validar que exista un rol permitido en la ruta.
    if (!rolesPermitidos?.length) {
        return router.parseUrl('/login');
    }

    // Comprobar que el rol del usuario pueda acceder.
    if (rolesPermitidos.includes(String(usuario.idRol))) {
        return true;
    }

    // Evitar redirecciones a dashboards para roles desconocidos.
    if (![1, 2, 3].includes(Number(usuario.idRol))) {
        return router.parseUrl('/login');
    }

    // Si intenta entrar al dashboard de otro rol,
    // redirigirlo al suyo.
    return router.parseUrl(
        '/' + authService.obtenerRutaDashboard(usuario)
    );
};
