// Analytics Module - Main Entry Point
// This module provides comprehensive financial analytics capabilities including:
// - Spending analysis with complex aggregations
// - Budget analytics and tracking
// - Financial insights and recommendations
// - Cash flow analysis
// - Period comparison analysis
// - Category performance analysis

// Export interfaces
export * from './interfaces/analytics.interface';
export * from './interfaces/predictive.interface';

// Export validation schemas
export * from './validation/analytics.validation';

// Export repository
export { AnalyticsRepository } from './repositories/analytics.repository';

// Export service
export { AnalyticsService } from './services/analytics.service';

// Export controller
export { AnalyticsController } from './controllers/analytics.controller';

// Export routes
export { default as analyticsRoutes } from './routes/analytics.routes';

// Export default analytics module configuration
export const analyticsModule = {
  name: 'analytics',
  version: '1.0.0',
  description: 'Comprehensive financial analytics module with complex aggregation queries',
  dependencies: [
    'transactions',
    'categories', 
    'budgets',
    'users'
  ],
  features: [
    'spending-analysis',
    'budget-analytics',
    'financial-insights',
    'cash-flow-analysis',
    'period-comparison',
    'category-performance',
    'export-capabilities'
  ]
};

// Analytics module initialization function
export const initializeAnalyticsModule = () => {
  console.log('🚀 Initializing Analytics Module...');
  
  // Module initialization logic can be added here
  // For example, setting up database indexes, caching, etc.
  
  console.log('✅ Analytics Module initialized successfully');
  return analyticsModule;
};

// Analytics module health check
export const checkAnalyticsModuleHealth = () => {
  return {
    status: 'healthy',
    module: 'analytics',
    timestamp: new Date().toISOString(),
    version: analyticsModule.version,
    features: analyticsModule.features.length,
    dependencies: analyticsModule.dependencies.length
  };
};

// Export analytics module types
export type AnalyticsModule = typeof analyticsModule;
export type AnalyticsModuleHealth = ReturnType<typeof checkAnalyticsModuleHealth>;