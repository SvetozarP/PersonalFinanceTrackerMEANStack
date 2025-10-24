import { ReportGeneratorService } from '../../modules/financial/analytics/services/report-generator.service';
import { AnalyticsService } from '../../modules/financial/analytics/services/analytics.service';
import { TransactionService } from '../../modules/financial/transactions/services/transaction.service';
import { CategoryService } from '../../modules/financial/categories/service/category.service';
import { BudgetService } from '../../modules/financial/budgets/services/budget.service';
import { IReportOptions, IReportResult } from '../../modules/financial/analytics/services/report-generator.service';

// Mock dependencies
jest.mock('../../modules/financial/analytics/services/analytics.service');
jest.mock('../../modules/financial/transactions/services/transaction.service');
jest.mock('../../modules/financial/categories/service/category.service');
jest.mock('../../modules/financial/budgets/services/budget.service');

// Mock external dependencies
jest.mock('puppeteer', () => ({
  launch: jest.fn()
}));

jest.mock('xlsx', () => ({
  utils: {
    book_new: jest.fn(),
    json_to_sheet: jest.fn(),
    book_append_sheet: jest.fn()
  },
  write: jest.fn()
}));

jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  readFileSync: jest.fn()
}));

jest.mock('path', () => ({
  join: jest.fn(),
  resolve: jest.fn()
}));

describe('ReportGeneratorService', () => {
  let reportGenerator: ReportGeneratorService;
  let mockAnalyticsService: jest.Mocked<AnalyticsService>;
  let mockTransactionService: jest.Mocked<TransactionService>;
  let mockCategoryService: jest.Mocked<CategoryService>;
  let mockBudgetService: jest.Mocked<BudgetService>;

  const mockUserId = '507f1f77bcf86cd799439011';
  const mockStartDate = new Date('2024-01-01');
  const mockEndDate = new Date('2024-01-31');

  const mockReportData = {
    metadata: {
      generatedAt: new Date('2024-01-31T10:00:00Z'),
      userId: mockUserId,
      dateRange: {
        start: mockStartDate,
        end: mockEndDate
      },
      reportType: 'comprehensive'
    },
    spending: {
      totalSpent: 1500.00,
      totalIncome: 2000.00,
      netAmount: 500.00,
      averageDailySpending: 48.39,
      averageMonthlySpending: 1500.00,
      spendingByCategory: [
        { categoryId: '1', categoryName: 'Food', categoryPath: 'Food', amount: 600.00, percentage: 40.0, transactionCount: 10, averageAmount: 60.00 },
        { categoryId: '2', categoryName: 'Transportation', categoryPath: 'Transportation', amount: 300.00, percentage: 20.0, transactionCount: 5, averageAmount: 60.00 },
        { categoryId: '3', categoryName: 'Entertainment', categoryPath: 'Entertainment', amount: 200.00, percentage: 13.3, transactionCount: 3, averageAmount: 66.67 }
      ],
      spendingByDay: [],
      spendingByMonth: [],
      topSpendingDays: [],
      spendingTrends: []
    },
    budgets: [
      {
        budgetId: '1',
        budgetName: 'Monthly Budget',
        totalAllocated: 2000.00,
        totalSpent: 1500.00,
        remainingAmount: 500.00,
        utilizationPercentage: 75.0,
        status: 'on-track' as const,
        categoryBreakdown: [],
        dailyProgress: [],
        alerts: []
      }
    ],
    cashFlow: {
      period: '2024-01',
      openingBalance: 1000.00,
      closingBalance: 1500.00,
      totalInflows: 3000.00,
      totalOutflows: 2500.00,
      netCashFlow: 500.00,
      cashFlowByType: [],
      cashFlowByCategory: [],
      cashFlowByPeriod: [],
      projections: []
    },
    insights: {
      spendingPatterns: {
        mostExpensiveDay: 'Monday',
        mostExpensiveMonth: 'January',
        leastExpensiveDay: 'Sunday',
        leastExpensiveMonth: 'December',
        averageTransactionAmount: 50.00,
        largestTransaction: 200.00,
        smallestTransaction: 10.00
      },
      categoryInsights: {
        highestSpendingCategory: 'Food',
        lowestSpendingCategory: 'Entertainment',
        mostFrequentCategory: 'Food',
        categoryGrowthRates: []
      },
      timeInsights: {
        peakSpendingTime: '12:00',
        peakSpendingDay: 'Monday',
        seasonalPatterns: []
      },
      recommendations: [
        { type: 'savings' as const, priority: 'medium' as const, message: 'Consider increasing savings rate', action: 'Increase monthly savings by 10%' }
      ]
    }
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock AnalyticsService
    mockAnalyticsService = {
      getSpendingAnalysis: jest.fn().mockResolvedValue(mockReportData.spending),
      getAllBudgetAnalytics: jest.fn().mockResolvedValue(mockReportData.budgets),
      getFinancialInsights: jest.fn().mockResolvedValue(mockReportData.insights),
      getCashFlowAnalysis: jest.fn().mockResolvedValue(mockReportData.cashFlow)
    } as any;

    // Mock other services
    mockTransactionService = {} as any;
    mockCategoryService = {} as any;
    mockBudgetService = {} as any;

    // Create service instance with mocked dependencies
    reportGenerator = new ReportGeneratorService();
    
    // Replace the service instances with mocks
    (reportGenerator as any).analyticsService = mockAnalyticsService;
    (reportGenerator as any).transactionService = mockTransactionService;
    (reportGenerator as any).categoryService = mockCategoryService;
    (reportGenerator as any).budgetService = mockBudgetService;
  });

  describe('generateReport', () => {
    it('should generate a PDF report successfully', async () => {
      const options: IReportOptions = {
        format: 'pdf',
        reportType: 'comprehensive',
        startDate: mockStartDate,
        endDate: mockEndDate,
        includeInsights: true
      };

      // Mock puppeteer
      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue({
          setContent: jest.fn().mockResolvedValue(undefined),
          pdf: jest.fn().mockResolvedValue(Buffer.from('mock pdf content'))
        }),
        close: jest.fn().mockResolvedValue(undefined)
      };
      
      const puppeteer = require('puppeteer');
      puppeteer.launch = jest.fn().mockResolvedValue(mockBrowser);

      const result = await reportGenerator.generateReport(mockUserId, options);

      expect(result).toBeDefined();
      expect(result.filename).toContain('financial-report-comprehensive');
      expect(result.filename).toContain('.pdf');
      expect(result.mimeType).toBe('application/pdf');
      expect(result.data).toBeInstanceOf(Buffer);
      expect(result.size).toBeGreaterThan(0);

      expect(mockAnalyticsService.getSpendingAnalysis).toHaveBeenCalled();
      expect(mockAnalyticsService.getAllBudgetAnalytics).toHaveBeenCalled();
      expect(mockAnalyticsService.getFinancialInsights).toHaveBeenCalled();
      expect(mockAnalyticsService.getCashFlowAnalysis).toHaveBeenCalled();
    });

    it('should generate an Excel report successfully', async () => {
      const options: IReportOptions = {
        format: 'excel',
        reportType: 'spending',
        startDate: mockStartDate,
        endDate: mockEndDate
      };

      // Mock XLSX
      const mockWorkbook = {
        utils: {
          book_new: jest.fn().mockReturnValue({}),
          json_to_sheet: jest.fn().mockReturnValue({}),
          book_append_sheet: jest.fn()
        },
        write: jest.fn().mockReturnValue(Buffer.from('mock excel content'))
      };
      
      const XLSX = require('xlsx');
      XLSX.utils = mockWorkbook.utils;
      XLSX.write = mockWorkbook.write;

      const result = await reportGenerator.generateReport(mockUserId, options);

      expect(result).toBeDefined();
      expect(result.filename).toContain('financial-report-spending');
      expect(result.filename).toContain('.xlsx');
      expect(result.mimeType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(result.data).toBeInstanceOf(Buffer);
      expect(result.size).toBeGreaterThan(0);
    });

    it('should generate a CSV report successfully', async () => {
      const options: IReportOptions = {
        format: 'csv',
        reportType: 'budgets',
        startDate: mockStartDate,
        endDate: mockEndDate
      };

      const result = await reportGenerator.generateReport(mockUserId, options);

      expect(result).toBeDefined();
      expect(result.filename).toContain('financial-report-budgets');
      expect(result.filename).toContain('.csv');
      expect(result.mimeType).toBe('text/csv');
      expect(result.data).toBeInstanceOf(Buffer);
      expect(result.size).toBeGreaterThan(0);
    });

    it('should generate a JSON report successfully', async () => {
      const options: IReportOptions = {
        format: 'json',
        reportType: 'cashflow',
        startDate: mockStartDate,
        endDate: mockEndDate
      };

      const result = await reportGenerator.generateReport(mockUserId, options);

      expect(result).toBeDefined();
      expect(result.filename).toContain('financial-report-cashflow');
      expect(result.filename).toContain('.json');
      expect(result.mimeType).toBe('application/json');
      expect(result.data).toBeInstanceOf(Buffer);
      expect(result.size).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', async () => {
      const options: IReportOptions = {
        format: 'pdf',
        reportType: 'comprehensive',
        startDate: mockStartDate,
        endDate: mockEndDate
      };

      // Mock puppeteer to throw an error
      const puppeteer = require('puppeteer');
      puppeteer.launch = jest.fn().mockRejectedValue(new Error('Puppeteer launch failed'));

      await expect(reportGenerator.generateReport(mockUserId, options))
        .rejects.toThrow('Puppeteer launch failed');
    });

    it('should collect data based on report type', async () => {
      const options: IReportOptions = {
        format: 'json',
        reportType: 'spending',
        startDate: mockStartDate,
        endDate: mockEndDate,
        includeInsights: false
      };

      const result = await reportGenerator.generateReport(mockUserId, options);

      expect(mockAnalyticsService.getSpendingAnalysis).toHaveBeenCalled();
      expect(mockAnalyticsService.getAllBudgetAnalytics).not.toHaveBeenCalled();
      expect(mockAnalyticsService.getFinancialInsights).not.toHaveBeenCalled();
      expect(mockAnalyticsService.getCashFlowAnalysis).not.toHaveBeenCalled();
    });
  });

  describe('HTML generation', () => {
    it('should generate proper HTML for PDF reports', () => {
      const html = (reportGenerator as any).generateHTMLReport(mockReportData, {
        format: 'pdf',
        reportType: 'comprehensive',
        startDate: mockStartDate,
        endDate: mockEndDate
      });

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<title>Financial Report</title>');
      expect(html).toContain('Spending Analysis');
      expect(html).toContain('Budget Analysis');
      expect(html).toContain('Cash Flow Analysis');
      expect(html).toContain('Financial Insights');
    });

    it('should include spending data in HTML', () => {
      const html = (reportGenerator as any).generateSpendingHTML(mockReportData.spending);
      
      expect(html).toContain('Spending Analysis');
      expect(html).toContain('$1500.00');
      expect(html).toContain('$48.39');
      expect(html).toContain('Food');
      expect(html).toContain('Transportation');
    });

    it('should include budget data in HTML', () => {
      const html = (reportGenerator as any).generateBudgetHTML(mockReportData.budgets);
      
      expect(html).toContain('Budget Analysis');
      expect(html).toContain('Monthly Budget');
      expect(html).toContain('$2000.00');
      expect(html).toContain('$1500.00');
    });

    it('should include cash flow data in HTML', () => {
      const html = (reportGenerator as any).generateCashFlowHTML(mockReportData.cashFlow);
      
      expect(html).toContain('Cash Flow Analysis');
      expect(html).toContain('$500.00');
      expect(html).toContain('$3000.00');
      expect(html).toContain('$2500.00');
    });

    it('should include insights data in HTML', () => {
      const html = (reportGenerator as any).generateInsightsHTML(mockReportData.insights);
      
      expect(html).toContain('Financial Insights');
      expect(html).toContain('Consider increasing savings rate');
    });
  });

  describe('Excel data preparation', () => {
    it('should prepare summary data correctly', () => {
      const summaryData = (reportGenerator as any).prepareSummaryData(mockReportData);
      
      expect(summaryData).toHaveLength(4);
      expect(summaryData[0]).toEqual({
        Metric: 'Report Type',
        Value: 'comprehensive'
      });
    });

    it('should prepare spending data correctly', () => {
      const spendingData = (reportGenerator as any).prepareSpendingData(mockReportData.spending);
      
      expect(spendingData).toHaveLength(3);
      expect(spendingData[0]).toEqual({
        Category: 'Food',
        Amount: 600.00,
        Percentage: 40.0
      });
    });

    it('should prepare budget data correctly', () => {
      const budgetData = (reportGenerator as any).prepareBudgetData(mockReportData.budgets);
      
      expect(budgetData).toHaveLength(1);
      expect(budgetData[0]).toEqual({
        'Budget Name': 'Monthly Budget',
        'Allocated': 2000.00,
        'Spent': 1500.00,
        'Variance': 500.00,
        'Percentage': 25.0
      });
    });

    it('should prepare cash flow data correctly', () => {
      const cashFlowData = (reportGenerator as any).prepareCashFlowData(mockReportData.cashFlow);
      
      expect(cashFlowData).toHaveLength(3);
      expect(cashFlowData[0]).toEqual({
        Metric: 'Net Cash Flow',
        Value: 500.00
      });
    });
  });

  describe('Error handling', () => {
    it('should handle missing data gracefully', async () => {
      const options: IReportOptions = {
        format: 'json',
        reportType: 'comprehensive',
        startDate: mockStartDate,
        endDate: mockEndDate
      };

      // Mock analytics service to return empty data
      mockAnalyticsService.getSpendingAnalysis.mockResolvedValue({
        totalSpent: 0,
        totalIncome: 0,
        netAmount: 0,
        averageDailySpending: 0,
        averageMonthlySpending: 0,
        spendingByCategory: [],
        spendingByDay: [],
        spendingByMonth: [],
        topSpendingDays: [],
        spendingTrends: []
      });
      mockAnalyticsService.getAllBudgetAnalytics.mockResolvedValue([]);
      mockAnalyticsService.getFinancialInsights.mockResolvedValue({
        spendingPatterns: {
          mostExpensiveDay: '',
          mostExpensiveMonth: '',
          leastExpensiveDay: '',
          leastExpensiveMonth: '',
          averageTransactionAmount: 0,
          largestTransaction: 0,
          smallestTransaction: 0
        },
        categoryInsights: {
          highestSpendingCategory: '',
          lowestSpendingCategory: '',
          mostFrequentCategory: '',
          categoryGrowthRates: []
        },
        timeInsights: {
          peakSpendingTime: '',
          peakSpendingDay: '',
          seasonalPatterns: []
        },
        recommendations: []
      });
      mockAnalyticsService.getCashFlowAnalysis.mockResolvedValue({
        period: '',
        openingBalance: 0,
        closingBalance: 0,
        totalInflows: 0,
        totalOutflows: 0,
        netCashFlow: 0,
        cashFlowByType: [],
        cashFlowByCategory: [],
        cashFlowByPeriod: [],
        projections: []
      });

      const result = await reportGenerator.generateReport(mockUserId, options);

      expect(result).toBeDefined();
      expect(result.filename).toContain('.json');
      expect(result.mimeType).toBe('application/json');
    });

    it('should handle unsupported format gracefully', async () => {
      const options = {
        format: 'unsupported' as any,
        reportType: 'comprehensive' as any,
        startDate: mockStartDate,
        endDate: mockEndDate
      };

      await expect(reportGenerator.generateReport(mockUserId, options))
        .rejects.toThrow('Unsupported format: unsupported');
    });
  });
});
