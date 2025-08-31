/**
 * @jest-environment node
 */

import { 
  analyticsModule, 
  initializeAnalyticsModule, 
  checkAnalyticsModuleHealth,
  AnalyticsModule,
  AnalyticsModuleHealth
} from '../../../../modules/financial/analytics/index';

describe('Analytics Module Index', () => {
  describe('analyticsModule', () => {
    it('should export the analytics module configuration', () => {
      expect(analyticsModule).toBeDefined();
      expect(analyticsModule.name).toBe('analytics');
      expect(analyticsModule.version).toBe('1.0.0');
      expect(analyticsModule.description).toBe('Comprehensive financial analytics module with complex aggregation queries');
    });

    it('should have required dependencies', () => {
      expect(analyticsModule.dependencies).toBeDefined();
      expect(Array.isArray(analyticsModule.dependencies)).toBe(true);
      expect(analyticsModule.dependencies).toContain('transactions');
      expect(analyticsModule.dependencies).toContain('categories');
      expect(analyticsModule.dependencies).toContain('budgets');
      expect(analyticsModule.dependencies).toContain('users');
    });

    it('should have required features', () => {
      expect(analyticsModule.features).toBeDefined();
      expect(Array.isArray(analyticsModule.features)).toBe(true);
      expect(analyticsModule.features).toContain('spending-analysis');
      expect(analyticsModule.features).toContain('budget-analytics');
      expect(analyticsModule.features).toContain('financial-insights');
      expect(analyticsModule.features).toContain('cash-flow-analysis');
      expect(analyticsModule.features).toContain('period-comparison');
      expect(analyticsModule.features).toContain('category-performance');
      expect(analyticsModule.features).toContain('export-capabilities');
    });
  });

  describe('initializeAnalyticsModule', () => {
    it('should initialize the analytics module successfully', () => {
      // Mock console.log to capture output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = initializeAnalyticsModule();

      expect(result).toBeDefined();
      expect(result).toEqual(analyticsModule);
      expect(consoleSpy).toHaveBeenCalledWith('🚀 Initializing Analytics Module...');
      expect(consoleSpy).toHaveBeenCalledWith('✅ Analytics Module initialized successfully');

      consoleSpy.mockRestore();
    });

    it('should return the analytics module configuration', () => {
      const result = initializeAnalyticsModule();
      
      expect(result.name).toBe('analytics');
      expect(result.version).toBe('1.0.0');
      expect(result.dependencies).toHaveLength(4);
      expect(result.features).toHaveLength(7);
    });
  });

  describe('checkAnalyticsModuleHealth', () => {
    it('should return health status information', () => {
      const health = checkAnalyticsModuleHealth();

      expect(health).toBeDefined();
      expect(health.status).toBe('healthy');
      expect(health.module).toBe('analytics');
      expect(health.timestamp).toBeDefined();
      expect(health.version).toBe('1.0.0');
      expect(health.features).toBe(7);
      expect(health.dependencies).toBe(4);
    });

    it('should return a valid timestamp', () => {
      const health = checkAnalyticsModuleHealth();
      const timestamp = new Date(health.timestamp);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });

    it('should return correct feature and dependency counts', () => {
      const health = checkAnalyticsModuleHealth();

      expect(health.features).toBe(analyticsModule.features.length);
      expect(health.dependencies).toBe(analyticsModule.dependencies.length);
    });
  });

  describe('Type exports', () => {
    it('should export AnalyticsModule type', () => {
      // This test verifies that the type is exported correctly
      // The actual type checking is done by TypeScript compiler
      expect(typeof analyticsModule).toBe('object');
    });

    it('should export AnalyticsModuleHealth type', () => {
      // This test verifies that the health check function returns the expected structure
      const health = checkAnalyticsModuleHealth();
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('module');
      expect(health).toHaveProperty('timestamp');
      expect(health).toHaveProperty('version');
      expect(health).toHaveProperty('features');
      expect(health).toHaveProperty('dependencies');
    });
  });

  describe('Module structure', () => {
    it('should have consistent module information', () => {
      expect(analyticsModule.name).toBe('analytics');
      expect(analyticsModule.version).toBe('1.0.0');
      expect(analyticsModule.description).toContain('financial analytics');
    });

    it('should have all required dependencies', () => {
      const requiredDependencies = ['transactions', 'categories', 'budgets', 'users'];
      
      requiredDependencies.forEach(dependency => {
        expect(analyticsModule.dependencies).toContain(dependency);
      });
    });

    it('should have all required features', () => {
      const requiredFeatures = [
        'spending-analysis',
        'budget-analytics', 
        'financial-insights',
        'cash-flow-analysis',
        'period-comparison',
        'category-performance',
        'export-capabilities'
      ];
      
      requiredFeatures.forEach(feature => {
        expect(analyticsModule.features).toContain(feature);
      });
    });
  });

  describe('Health check consistency', () => {
    it('should return consistent health information across calls', () => {
      const health1 = checkAnalyticsModuleHealth();
      const health2 = checkAnalyticsModuleHealth();

      expect(health1.status).toBe(health2.status);
      expect(health1.module).toBe(health2.module);
      expect(health1.version).toBe(health2.version);
      expect(health1.features).toBe(health2.features);
      expect(health1.dependencies).toBe(health2.dependencies);
    });

    it('should return healthy status', () => {
      const health = checkAnalyticsModuleHealth();
      expect(health.status).toBe('healthy');
    });

    it('should return correct module name', () => {
      const health = checkAnalyticsModuleHealth();
      expect(health.module).toBe('analytics');
    });
  });
});
