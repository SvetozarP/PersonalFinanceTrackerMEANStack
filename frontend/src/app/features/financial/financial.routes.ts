import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';

export const FINANCIAL_ROUTES: Routes = [
  {
    path: 'financial',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./components/financial-dashboard/financial-dashboard')
          .then(m => m.FinancialDashboardComponent),
        title: 'Financial Dashboard'
      },
      {
        path: 'transactions',
        loadComponent: () => import('./components/transaction-list/transaction-list')
          .then(m => m.TransactionListComponent),
        title: 'Transactions'
      },
      {
        path: 'transactions/new',
        loadComponent: () => import('./components/transaction-form/transaction-form')
          .then(m => m.TransactionFormComponent),
        title: 'New Transaction'
      },
      {
        path: 'transactions/:id',
        loadComponent: () => import('./components/transaction-details/transaction-details')
          .then(m => m.TransactionDetailsComponent),
        title: 'Transaction Details'
      },
      {
        path: 'transactions/:id/edit',
        loadComponent: () => import('./components/transaction-form/transaction-form')
          .then(m => m.TransactionFormComponent),
        title: 'Edit Transaction'
      },
      {
        path: 'categories',
        loadComponent: () => import('./components/category-list/category-list')
          .then(m => m.CategoryListComponent),
        title: 'Categories'
      },
      {
        path: 'categories/new',
        loadComponent: () => import('./components/category-form/category-form')
          .then(m => m.CategoryFormComponent),
        title: 'New Category'
      },
      {
        path: 'categories/:id/edit',
        loadComponent: () => import('./components/category-form/category-form')
          .then(m => m.CategoryFormComponent),
        title: 'Edit Category'
      },
      {
        path: 'category-tree',
        loadComponent: () => import('./components/category-tree/category-tree')
          .then(m => m.CategoryTreeComponent),
        title: 'Category Tree'
      },
      {
        path: 'charts',
        loadComponent: () => import('./components/financial-charts/financial-charts')
          .then(m => m.FinancialChartsComponent),
        title: 'Financial Charts'
      },
      {
        path: 'reports',
        loadComponent: () => import('./components/financial-reports/financial-reports')
          .then(m => m.FinancialReportsComponent),
        title: 'Financial Reports'
      },
      {
        path: 'budgets',
        loadComponent: () => import('./components/budget-management/budget-management')
          .then(m => m.BudgetManagementComponent),
        title: 'Budget Management'
      },
      {
        path: 'insights',
        loadComponent: () => import('./components/financial-insights/financial-insights')
          .then(m => m.FinancialInsightsComponent),
        title: 'Financial Insights'
      },
      {
        path: 'goals',
        loadComponent: () => import('./components/financial-goals/financial-goals')
          .then(m => m.FinancialGoalsComponent),
        title: 'Financial Goals'
      }
    ]
  }
];