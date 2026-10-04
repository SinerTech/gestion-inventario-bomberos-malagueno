import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { MainLayout } from './layouts/main-layout/main-layout';
import { QuienesSomos } from './pages/quienes-somos/quienes-somos';
import { LandingPage } from './pages/landing-page/landing-page';
import { DashboardSupervisor } from './pages/dashboard/dashboard-supervisor/dashboard-supervisor';
import { DashboardAdmin } from './pages/dashboard/dashboard-admin/dashboard-admin';
import { DashboardOperativo } from './pages/dashboard/dashboard-operativo/dashboard-operativo';
import { GestionUsuario } from './pages/dashboard/dashboard-admin/gestion-usuario/gestion-usuario';
import { GestionProveedor } from './pages/dashboard/dashboard-admin/gestion-proveedor/gestion-proveedor';
import { GestionRecurso } from './pages/dashboard/dashboard-admin/gestion-recurso/gestion-recurso';
import { InicioDashboard } from './shared/inicio-dashboard/inicio-dashboard';
import { ControlInventario } from './shared/control-inventario/control-inventario';
import { Pagina404 } from './pages/pagina-404/pagina-404';

export const routes: Routes = [
    { path: '', redirectTo: 'bomberos-malagueno/landing-page', pathMatch: 'full' },
    { path: 'login', component: Login },
    {
        path: 'bomberos-malagueno',
        component: MainLayout,
        children: [
            { path: 'quienes-somos', component: QuienesSomos },
            { path: 'landing-page', component: LandingPage },
            {
                path: 'dashboard-supervisor',
                component: DashboardSupervisor,
                data: { rolesPermitidos: ['2'] },
            },
            {
                path: 'dashboard-admin',
                component: DashboardAdmin,
                data: { rolesPermitidos: ['1'] },
                children: [
                    { path: '', redirectTo: 'inicio-dashboard', pathMatch: 'full' },
                    {
                        path: 'inicio-dashboard',
                        component: InicioDashboard,
                        data: { tipoDashboard: 'administrador' },
                    },
                    { path: 'gestion-usuario', component: GestionUsuario },
                    { path: 'gestion-proveedor', component: GestionProveedor },
                    { path: 'gestion-recurso', component: GestionRecurso },
                    { path: 'control-inventario', component: ControlInventario},
                ]
            },
            {
            path: 'dashboard-operativo',
            component: DashboardOperativo,
            data: { rolesPermitidos: ['3'] },
            }
        ]
    },
    { path: '**', component: Pagina404 },
];
