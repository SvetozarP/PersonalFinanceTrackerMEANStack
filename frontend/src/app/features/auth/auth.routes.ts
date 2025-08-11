import { Routes } from '@angular/router';
import { GuestGuard } from './guards/guest.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then(m => m.LoginComponent),
    canActivate: [GuestGuard],
    title: 'Login - Finance Tracker'
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register').then(m => m.RegisterComponent),
    canActivate: [GuestGuard],
    title: 'Register - Finance Tracker'
  },
  // {
  //   path: 'forgot-password',
  //   loadComponent: () => import('./components/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
  //   canActivate: [GuestGuard],
  //   title: 'Forgot Password - Finance Tracker'
  // },
  // {
  //   path: 'reset-password',
  //   loadComponent: () => import('./components/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
  //   canActivate: [GuestGuard],
  //   title: 'Reset Password - Finance Tracker'
  // },
  // Removed redundant redirect to prevent double component instantiation
];