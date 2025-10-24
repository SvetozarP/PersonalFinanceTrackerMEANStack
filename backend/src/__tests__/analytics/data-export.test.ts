import { DataExportService } from '../../modules/financial/analytics/services/data-export.service';
import { IExportOptions, IExportResult } from '../../modules/financial/analytics/services/data-export.service';

// Mock dependencies
jest.mock('../../modules/financial/analytics/services/analytics.service', () => ({
  AnalyticsService: jest.fn().mockImplementation(() => ({
    getSpendingAnalysis: jest.fn(),
    getAllBudgetAnalytics: jest.fn(),
    getFinancialInsights: jest.fn(),
    getCashFlowAnalysis: jest.fn()
  }))
}));

jest.mock('../../modules/financial/transactions/services/transaction.service', () => ({
  TransactionService: jest.fn()
}));

jest.mock('../../modules/financial/categories/service/category.service', () => ({
  CategoryService: jest.fn()
}));

jest.mock('../../modules/financial/budgets/services/budget.service', () => ({
  BudgetService: jest.fn()
}));

// Mock external dependencies
jest.mock('xlsx', () => ({
  utils: {
    book_new: jest.fn().mockReturnValue({}),
    json_to_sheet: jest.fn().mockReturnValue({}),
    book_append_sheet: jest.fn(),
    write: jest.fn().mockReturnValue(Buffer.from('mock excel content'))
  }
}));

jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  readFileSync: jest.fn()
}));

jest.mock('path', () => ({
  join: jest.fn(),
  resolve: jest.fn()
}));

describe('DataExportService', () => {
  let dataExportService: DataExportService;
  const mockUserId = '507f1f77bcf86cd799439011';
  const mockStartDate = new Date('2024-01-01');
  const mockEndDate = new Date('2024-01-31');

  beforeEach(() => {
    jest.clearAllMocks();
    dataExportService = new DataExportService();
  });

  describe('Export Financial Data', () => {
    it('should export all financial data in Excel format', async () => {
      const options: IExportOptions = {
        format: 'excel',
        dataTypes: ['all'],
        startDate: mockStartDate,
        endDate: mockEndDate,
        includeMetadata: true
      };

      const result = await dataExportService.exportFinancialData(mockUserId, options);

      expect(result).toBeDefined();
      expect(result.filename).toContain('financial-data-export');
      expect(result.filename).toContain('.xlsx');
      expect(result.mimeType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(result.data).toBeInstanceOf(Buffer);
      expect(result.size).toBeGreaterThan(0);
      expect(result.recordCount).toBeGreaterThan(0);
      expect(result.exportDate).toBeInstanceOf(Date);
    });

    it('should export all financial data in CSV format', async () => {
      const options: IExportOptions = {
        format: 'csv',
        dataTypes: ['all'],
        startDate: mockStartDate,
        endDate: mockEndDate,
        includeMetadata: true
      };

      const result = await dataExportService.exportFinancialData(mockUserId, options);

      expect(result).toBeDefined();
      expect(result.filename).toContain('financial-data-export');
      expect(result.filename).toContain('.csv');
      expect(result.mimeType).toBe('text/csv');
      expect(result.data).toBeInstanceOf(Buffer);
      expect(result.size).toBeGreaterThan(0);
    });

    it('should export all financial data in JSON format', async () => {
      const options: IExportOptions = {
        format: 'json',
        dataTypes: ['all'],
        startDate: mockStartDate,
        endDate: mockEndDate,
        includeMetadata: true
      };

      const result = await dataExportService.exportFinancialData(mockUserId, options);

      expect(result).toBeDefined();
      expect(result.filename).toContain('financial-data-export');
      expect(result.filename).toContain('.json');
      expect(result.mimeType).toBe('application/json');
      expect(result.data).toBeInstanceOf(Buffer);
      expect(result.size).toBeGreaterThan(0);
    });

    it('should export only specific data types', async () => {
      const options: IExportOptions = {
        format: 'excel',
        dataTypes: ['transactions', 'categories'],
        startDate: mockStartDate,
        endDate: mockEndDate,
        includeMetadata: false
      };

      const result = await dataExportService.exportFinancialData(mockUserId, options);

      expect(result).toBeDefined();
      expect(result.filename).toContain('.xlsx');
      expect(result.mimeType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('should handle filters correctly', async () => {
      const options: IExportOptions = {
        format: 'excel',
        dataTypes: ['transactions'],
        startDate: mockStartDate,
        endDate: mockEndDate,
        includeMetadata: true,
        filters: {
          categories: ['Food', 'Transportation'],
          transactionTypes: ['expense'],
          minAmount: 10,
          maxAmount: 1000
        }
      };

      const result = await dataExportService.exportFinancialData(mockUserId, options);

      expect(result).toBeDefined();
      expect(result.filename).toContain('.xlsx');
    });
  });

  describe('Export Specific Data Types', () => {
    it('should export transactions only', async () => {
      const options = {
        format: 'excel' as const,
        startDate: mockStartDate,
        endDate: mockEndDate,
        includeMetadata: true,
        filters: {}
      };

      const result = await dataExportService.exportTransactions(mockUserId, options);

      expect(result).toBeDefined();
      expect(result.filename).toContain('financial-data-export');
      expect(result.mimeType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('should export categories only', async () => {
      const options = {
        format: 'csv' as const,
        startDate: mockStartDate,
        endDate: mockEndDate,
        includeMetadata: true
      };

      const result = await dataExportService.exportCategories(mockUserId, options);

      expect(result).toBeDefined();
      expect(result.filename).toContain('financial-data-export');
      expect(result.mimeType).toBe('text/csv');
    });

    it('should export budgets only', async () => {
      const options = {
        format: 'json' as const,
        startDate: mockStartDate,
        endDate: mockEndDate,
        includeMetadata: true
      };

      const result = await dataExportService.exportBudgets(mockUserId, options);

      expect(result).toBeDefined();
      expect(result.filename).toContain('financial-data-export');
      expect(result.mimeType).toBe('application/json');
    });

    it('should export analytics only', async () => {
      const options = {
        format: 'excel' as const,
        startDate: mockStartDate,
        endDate: mockEndDate,
        includeMetadata: true,
        groupBy: 'month' as const
      };

      const result = await dataExportService.exportAnalytics(mockUserId, options);

      expect(result).toBeDefined();
      expect(result.filename).toContain('financial-data-export');
      expect(result.mimeType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });
  });

  describe('Data Collection', () => {
    it('should collect transactions data', async () => {
      const transactions = await (dataExportService as any).getTransactions(mockUserId, {
        format: 'excel',
        dataTypes: ['transactions'],
        startDate: mockStartDate,
        endDate: mockEndDate
      });

      expect(transactions).toBeDefined();
      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions.length).toBeGreaterThan(0);
      expect(transactions[0]).toHaveProperty('id');
      expect(transactions[0]).toHaveProperty('amount');
      expect(transactions[0]).toHaveProperty('description');
      expect(transactions[0]).toHaveProperty('type');
      expect(transactions[0]).toHaveProperty('category');
    });

    it('should collect categories data', async () => {
      const categories = await (dataExportService as any).getCategories(mockUserId);

      expect(categories).toBeDefined();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories[0]).toHaveProperty('id');
      expect(categories[0]).toHaveProperty('name');
      expect(categories[0]).toHaveProperty('type');
    });

    it('should collect budgets data', async () => {
      const budgets = await (dataExportService as any).getBudgets(mockUserId, {
        format: 'excel',
        dataTypes: ['budgets'],
        startDate: mockStartDate,
        endDate: mockEndDate
      });

      expect(budgets).toBeDefined();
      expect(Array.isArray(budgets)).toBe(true);
      expect(budgets.length).toBeGreaterThan(0);
      expect(budgets[0]).toHaveProperty('id');
      expect(budgets[0]).toHaveProperty('name');
      expect(budgets[0]).toHaveProperty('totalAmount');
      expect(budgets[0]).toHaveProperty('spentAmount');
    });

    it('should collect analytics data', async () => {
      const analytics = await (dataExportService as any).getAnalytics(mockUserId, {
        format: 'excel',
        dataTypes: ['analytics'],
        startDate: mockStartDate,
        endDate: mockEndDate,
        groupBy: 'month'
      });

      expect(analytics).toBeDefined();
      expect(analytics).toHaveProperty('spending');
      expect(analytics).toHaveProperty('budgets');
      expect(analytics).toHaveProperty('insights');
      expect(analytics).toHaveProperty('cashFlow');
    });
  });

  describe('Metadata Creation', () => {
    it('should create metadata correctly', () => {
      const options: IExportOptions = {
        format: 'excel',
        dataTypes: ['all'],
        startDate: mockStartDate,
        endDate: mockEndDate,
        includeMetadata: true,
        filters: { categories: ['Food'] }
      };

      const metadata = (dataExportService as any).createMetadata(mockUserId, options, 'all');

      expect(metadata).toBeDefined();
      expect(metadata.userId).toBe(mockUserId);
      expect(metadata.dataType).toBe('all');
      expect(metadata.format).toBe('excel');
      expect(metadata.dateRange.start).toEqual(mockStartDate);
      expect(metadata.dateRange.end).toEqual(mockEndDate);
      expect(metadata.includeMetadata).toBe(true);
      expect(metadata.filters).toEqual({ categories: ['Food'] });
      expect(metadata.exportDate).toBeInstanceOf(Date);
    });
  });

  describe('Record Count Calculation', () => {
    it('should calculate record count correctly', () => {
      const exportData = {
        transactions: [{ id: '1' }, { id: '2' }],
        categories: [{ id: '1' }],
        budgets: [{ id: '1' }, { id: '2' }, { id: '3' }],
        analytics: { spending: {} }
      };

      const count = (dataExportService as any).calculateRecordCount(exportData);

      expect(count).toBe(6); // 2 + 1 + 3 + 1
    });

    it('should handle empty data', () => {
      const exportData = {};

      const count = (dataExportService as any).calculateRecordCount(exportData);

      expect(count).toBe(0);
    });

    it('should handle partial data', () => {
      const exportData = {
        transactions: [{ id: '1' }],
        analytics: { spending: {} }
      };

      const count = (dataExportService as any).calculateRecordCount(exportData);

      expect(count).toBe(2); // 1 + 1
    });
  });

  describe('Error Handling', () => {
    it('should handle unsupported format gracefully', async () => {
      const options = {
        format: 'unsupported' as any,
        dataTypes: ['all'] as const,
        startDate: mockStartDate,
        endDate: mockEndDate
      };

      await expect(dataExportService.exportFinancialData(mockUserId, options))
        .rejects.toThrow('Unsupported export format: unsupported');
    });

    it('should handle missing required fields', async () => {
      const options = {
        format: 'excel' as const,
        dataTypes: ['all'] as const,
        startDate: mockStartDate
        // Missing endDate
      } as any;

      await expect(dataExportService.exportFinancialData(mockUserId, options))
        .rejects.toThrow();
    });
  });

  describe('File Generation', () => {
    it('should generate Excel files with correct structure', async () => {
      const options: IExportOptions = {
        format: 'excel',
        dataTypes: ['all'],
        startDate: mockStartDate,
        endDate: mockEndDate,
        includeMetadata: true
      };

      const result = await dataExportService.exportFinancialData(mockUserId, options);

      expect(result.filename).toMatch(/financial-data-export-\d{4}-\d{2}-\d{2}\.xlsx$/);
      expect(result.mimeType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('should generate CSV files with correct structure', async () => {
      const options: IExportOptions = {
        format: 'csv',
        dataTypes: ['transactions'],
        startDate: mockStartDate,
        endDate: mockEndDate,
        includeMetadata: true
      };

      const result = await dataExportService.exportFinancialData(mockUserId, options);

      expect(result.filename).toMatch(/financial-data-export-\d{4}-\d{2}-\d{2}\.csv$/);
      expect(result.mimeType).toBe('text/csv');
    });

    it('should generate JSON files with correct structure', async () => {
      const options: IExportOptions = {
        format: 'json',
        dataTypes: ['categories'],
        startDate: mockStartDate,
        endDate: mockEndDate,
        includeMetadata: true
      };

      const result = await dataExportService.exportFinancialData(mockUserId, options);

      expect(result.filename).toMatch(/financial-data-export-\d{4}-\d{2}-\d{2}\.json$/);
      expect(result.mimeType).toBe('application/json');
    });
  });
});
