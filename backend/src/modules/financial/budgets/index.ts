// Budget Module Index
// This file exports all budget-related components for easy importing

// Models
export { default as Budget } from './models/budget.model';
export type { IBudget, IBudgetModel } from './interfaces/budget.interface';

// Interfaces
export type {
  ICreateBudgetDto,
  IUpdateBudgetDto,
  IBudgetFilters,
  IBudgetAnalytics,
  IBudgetSummary,
  IBudgetStatistics,
  IBudgetAlert,
  ICategoryBudgetBreakdown,
  ISpendingTrend,
  ICategoryAllocation,
  BudgetPeriod,
  BudgetStatus,
} from './interfaces/budget.interface';

// Repositories
export { default as BudgetRepository } from './repositories/budget.repository';

// Services
export { default as BudgetService } from './services/budget.service';

// Controllers
export { default as BudgetController } from './controllers/budget.controller';

// Routes
export { default as budgetRoutes } from './routes/budget.routes';

// Validation
export {
  default as budgetValidation,
  validateBudgetInput,
} from './validation/budget.validation';

// Budget Module Configuration
export const budgetModuleConfig = {
  name: 'budget',
  version: '1.0.0',
  description: 'Budget management module with flexible category allocation',
  dependencies: ['auth', 'financial.categories', 'financial.transactions'],
  features: [
    'budget-creation',
    'category-allocation',
    'budget-tracking',
    'spending-analytics',
    'budget-alerts',
    'budget-statistics',
    'flexible-periods',
    'rollover-support',
  ],
};

// Export all budget-related types for convenience
export * from './interfaces/budget.interface';
