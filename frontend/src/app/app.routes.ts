import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { MainLayout } from './layouts/main-layout/main-layout';
import { QuienesSomos } from './pages/quienes-somos/quienes-somos';
import { LandingPage } from './pages/landing-page/landing-page';
import { DashboardSupervisor } from './pages/dashboard/dashboard-supervisor/dashboard-supervisor';
import { DashboardAdmin } from './pages/dashboard/dashboard-admin/dashboard-admin';
import { DashboardOperativo } from './pages/dashboard/dashboard-operativo/dashboard-operativo';

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
            },
            {
            path: 'dashboard-operativo',
            component: DashboardOperativo,
            data: { rolesPermitidos: ['3'] },
            }
        ]
    }
];
