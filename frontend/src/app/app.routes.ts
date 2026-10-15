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
import { RegistroIngreso } from './shared/registro-ingreso/registro-ingreso';
import { RetiroRecurso } from './pages/dashboard/dashboard-supervisor/retiro-recurso/retiro-recurso';
import { DevolucionRecurso } from './pages/dashboard/dashboard-supervisor/devolucion-recurso/devolucion-recurso';
import { MisRecursos } from './pages/dashboard/dashboard-operativo/mis-recursos/mis-recursos';
import { ReportarNovedad } from './pages/dashboard/dashboard-operativo/reportar-novedad/reportar-novedad';
import { authGuard } from './guards/auth.guard';
import { GestionAlerta } from './pages/dashboard/dashboard-admin/gestion-alerta/gestion-alerta';
import { RegistroInicial } from './auth/registro-inicial/registro-inicial';

export const routes: Routes = [
    { path: '', redirectTo: 'bomberos-malagueno/landing-page', pathMatch: 'full' },
    { path: 'login', component: Login },
    { path: 'registro-inicial', component: RegistroInicial },
    {
        path: 'bomberos-malagueno',
        component: MainLayout,
        children: [
            { path: 'quienes-somos', component: QuienesSomos },
            { path: 'landing-page', component: LandingPage },
            {
                path: 'dashboard-supervisor',
                component: DashboardSupervisor,
                canActivate: [authGuard],
                data: { rolesPermitidos: ['2'] },
                children: [
                    { path: '', redirectTo: 'inicio-dashboard', pathMatch: 'full' },
                    {
                        path: 'inicio-dashboard',
                        component: InicioDashboard,
                        data: { tipoDashboard: 'supervisor' },
                    },
                    { path: 'retiro-recurso', component: RetiroRecurso },
                    { path: 'registro-ingreso', component: RegistroIngreso},
                    { path: 'devolucion-recurso', component: DevolucionRecurso },
                    { 
                        path: 'control-inventario', 
                        component: ControlInventario,
                        data: { tipoDashboard: 'supervisor' },
                    },
                ]
            },
            {
                path: 'dashboard-admin',
                component: DashboardAdmin,
                canActivate: [authGuard],
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
                    { 
                        path: 'control-inventario', 
                        component: ControlInventario,
                        data: { tipoDashboard: 'administrador' },
                    },
                    { path: 'gestion-alerta', component: GestionAlerta },
                    { path: 'registro-ingreso', component: RegistroIngreso},
                ]
            },
            {
            path: 'dashboard-operativo',
            component: DashboardOperativo,
            canActivate: [authGuard],
            data: { rolesPermitidos: ['3'] },
            children: [
                { path: '', redirectTo: 'inicio-dashboard', pathMatch: 'full' },
                    {
                        path: 'inicio-dashboard',
                        component: InicioDashboard,
                        data: { tipoDashboard: 'bombero' },
                    },
                { path: 'mis-recursos', component: MisRecursos },
                { path: 'reportar-novedad', component: ReportarNovedad },
            ]
            }
        ]
    },
    { path: '**', component: Pagina404 },
];
