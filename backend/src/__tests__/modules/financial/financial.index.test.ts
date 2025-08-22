import { 
  Category,
  categoryValidation,
  CategoryRepository,
  CategoryService,
  CategoryController,
  Transaction,
  transactionValidation,
  TransactionRepository,
  TransactionService,
  TransactionController,
  FinancialService,
  FinancialController
} from '../../../modules/financial';

describe('Financial Module Index', () => {
  describe('Category Module Exports', () => {
    it('should export Category model', () => {
      expect(Category).toBeDefined();
    });

    it('should export categoryValidation', () => {
      expect(categoryValidation).toBeDefined();
    });

    it('should export CategoryRepository', () => {
      expect(CategoryRepository).toBeDefined();
    });

    it('should export CategoryService', () => {
      expect(CategoryService).toBeDefined();
    });

    it('should export CategoryController', () => {
      expect(CategoryController).toBeDefined();
    });
  });

  describe('Transaction Module Exports', () => {
    it('should export Transaction model', () => {
      expect(Transaction).toBeDefined();
    });

    it('should export transactionValidation', () => {
      expect(transactionValidation).toBeDefined();
    });

    it('should export TransactionRepository', () => {
      expect(TransactionRepository).toBeDefined();
    });

    it('should export TransactionService', () => {
      expect(TransactionService).toBeDefined();
    });

    it('should export TransactionController', () => {
      expect(TransactionController).toBeDefined();
    });
  });

  describe('Main Financial Module Exports', () => {
    it('should export FinancialService', () => {
      expect(FinancialService).toBeDefined();
    });

    it('should export FinancialController', () => {
      expect(FinancialController).toBeDefined();
    });
  });

  describe('Export Completeness', () => {
    it('should export all required category components', () => {
      const categoryExports = [
        'Category',
        'categoryValidation',
        'CategoryRepository',
        'CategoryService',
        'CategoryController'
      ];

      categoryExports.forEach(exportName => {
        expect(require('../../../modules/financial')[exportName]).toBeDefined();
      });
    });

    it('should export all required transaction components', () => {
      const transactionExports = [
        'Transaction',
        'transactionValidation', 
        'TransactionRepository',
        'TransactionService',
        'TransactionController'
      ];

      transactionExports.forEach(exportName => {
        expect(require('../../../modules/financial')[exportName]).toBeDefined();
      });
    });

    it('should export all required financial components', () => {
      const financialExports = [
        'FinancialService',
        'FinancialController'
      ];

      financialExports.forEach(exportName => {
        expect(require('../../../modules/financial')[exportName]).toBeDefined();
      });
    });
  });

  describe('Module Structure', () => {
    it('should maintain proper module organization', () => {
      // Test that the index file properly organizes exports by module
      const financialModule = require('../../../modules/financial');
      
      // Check that all exports are present
      expect(Object.keys(financialModule).length).toBeGreaterThan(0);
      
      // Verify that exports are properly categorized
      const hasCategoryExports = ['Category', 'CategoryService', 'CategoryController'].some(
        exportName => financialModule[exportName]
      );
      expect(hasCategoryExports).toBe(true);
      
      const hasTransactionExports = ['Transaction', 'TransactionService', 'TransactionController'].some(
        exportName => financialModule[exportName]
      );
      expect(hasTransactionExports).toBe(true);
      
      const hasFinancialExports = ['FinancialService', 'FinancialController'].some(
        exportName => financialModule[exportName]
      );
      expect(hasFinancialExports).toBe(true);
    });
  });
});
