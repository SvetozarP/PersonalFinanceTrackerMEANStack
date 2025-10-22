import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'dashboard',
    redirectTo: 'financial/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'responsive-dashboard',
    loadComponent: () => import('./features/dashboard/responsive-dashboard/responsive-dashboard').then(m => m.ResponsiveDashboardComponent),
    canActivate: [AuthGuard],
    title: 'Responsive Dashboard - Finance Tracker'
  },
  {
    path: 'responsive-demo',
    loadComponent: () => import('./features/dashboard/responsive-demo/responsive-demo').then(m => m.ResponsiveDemoComponent),
    canActivate: [AuthGuard],
    title: 'Responsive Demo - Finance Tracker'
  },
  {
    path: 'financial',
    loadChildren: () => import('./features/financial/financial.routes').then(m => m.FINANCIAL_ROUTES)
  },
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  }
];