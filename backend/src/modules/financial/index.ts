// Financial Module - Main Entry Point
// This module provides comprehensive financial management capabilities

// Export core financial interfaces and types
export * from './transactions/interfaces/transaction.interface';
export * from './categories/interfaces/category.interface';
export * from './budgets/interfaces/budget.interface';

// Export models
export * from './transactions/models/transaction.model';
export * from './categories/models/category.model';
export * from './budgets/models/budget.model';

// Export repositories
export * from './transactions/repositories/transaction.repository';
export * from './categories/repositories/category.repository';
export * from './budgets/repositories/budget.repository';

// Export services
export * from './transactions/services/transaction.service';
export * from './categories/service/category.service';
export * from './budgets/services/budget.service';

// Export controllers
export * from './transactions/controllers/transaction.controller';
export * from './categories/controllers/category.controller';
export * from './budgets/controllers/budget.controller';

// Export routes
export { default as transactionRoutes } from './transactions/routes/transaction.routes';
export { default as categoryRoutes } from './categories/routes/category.routes';
export { default as budgetRoutes } from './budgets/routes/budget.routes';

// Export analytics module
export { analyticsModule } from './analytics';

// Export main financial service
export { FinancialService } from './financial.service';
export { FinancialController } from './financial.controller';
export { default as financialRoutes } from './financial.routes';

// Financial module configuration
export const financialModule = {
  name: 'financial',
  version: '2.0.0',
  description: 'Comprehensive financial management system with analytics',
  submodules: [
    'transactions',
    'categories',
    'budgets',
    'analytics'
  ],
  features: [
    'transaction-management',
    'category-hierarchy',
    'budget-planning',
    'spending-analysis',
    'budget-tracking',
    'financial-insights',
    'cash-flow-analysis',
    'period-comparison',
    'category-performance',
    'export-capabilities'
  ]
};

// Financial module initialization
export const initializeFinancialModule = () => {
  console.log('💰 Initializing Financial Module...');
  
  // Initialize analytics submodule
  const analyticsModule = require('./analytics').initializeAnalyticsModule();
  
  console.log('✅ Financial Module initialized successfully');
  console.log(`📊 Analytics Module: ${analyticsModule.version}`);
  
  return financialModule;
};

// Financial module health check
export const checkFinancialModuleHealth = () => {
  const analyticsHealth = require('./analytics').checkAnalyticsModuleHealth();
  
  return {
    status: 'healthy',
    module: 'financial',
    timestamp: new Date().toISOString(),
    version: financialModule.version,
    submodules: financialModule.submodules.length,
    features: financialModule.features.length,
    analytics: analyticsHealth
  };
};

// Export financial module types
export type FinancialModule = typeof financialModule;
export type FinancialModuleHealth = ReturnType<typeof checkFinancialModuleHealth>;