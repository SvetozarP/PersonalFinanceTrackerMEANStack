import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FinancialService } from './financial.service';
import { FinancialDashboard, Transaction, TransactionType, TransactionStatus, Category, FinancialReport, BudgetAnalysis, FinancialInsights } from '../models/financial.model';
import { environment } from '../../../environments/environment';

describe('FinancialService', () => {
  let service: FinancialService;
  let httpMock: HttpTestingController;

  const mockDashboard: FinancialDashboard = {
    overview: {
      totalBalance: 10000,
      monthlyIncome: 5000,
      monthlyExpenses: 3000,
      monthlyNet: 2000,
      pendingTransactions: 5,
      upcomingRecurring: 3
    },
    recentTransactions: [],
    topCategories: [],
    spendingTrends: [],
    budgetStatus: []
  };

  const mockTransaction: Transaction = {
    _id: '1',
    title: 'Test Transaction',
    description: 'Test Description',
    amount: 100,
    currency: 'USD',
    type: TransactionType.EXPENSE,
    status: TransactionStatus.COMPLETED,
    categoryId: 'cat1',
    tags: [],
    date: new Date(),
    timezone: 'UTC',
    paymentMethod: 'cash' as any,
    isRecurring: false,
    recurrencePattern: 'none' as any,
    attachments: [],
    source: 'manual',
    userId: 'user1',
    accountId: 'account1',
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false
  };

  const mockCategory: Category = {
    _id: 'cat1',
    name: 'Test Category',
    description: 'Test Description',
    color: '#FF0000',
    icon: 'test-icon',
    path: ['Test Category'],
    level: 1,
    isActive: true,
    isSystem: false,
    userId: 'user1',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FinancialService]
    });
    service = TestBed.inject(FinancialService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    if (httpMock) {
      httpMock.verify();
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getFinancialDashboard', () => {
    it('should get financial dashboard data', () => {
      service.getFinancialDashboard().subscribe(dashboard => {
        expect(dashboard).toEqual(mockDashboard);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/financial/dashboard`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockDashboard });
    });

    it('should get financial dashboard with parameters', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const accountId = 'account1';

      service.getFinancialDashboard({ startDate, endDate, accountId }).subscribe(dashboard => {
        expect(dashboard).toEqual(mockDashboard);
      });

      const req = httpMock.expectOne(request => 
        request.url === `${environment.apiUrl}/financial/dashboard` &&
        request.params.get('startDate') === startDate.toISOString() &&
        request.params.get('endDate') === endDate.toISOString() &&
        request.params.get('accountId') === accountId
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockDashboard });
    });

    it('should handle errors', () => {
      service.getFinancialDashboard().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/financial/dashboard`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('generateFinancialReport', () => {
    it('should generate financial report', () => {
      const options = {
        reportType: 'monthly' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        includeCategories: true,
        includeTrends: true,
        includeProjections: false
      };

      const mockReport: FinancialReport = {
        reportType: 'monthly',
        period: { start: options.startDate, end: options.endDate },
        summary: {
          totalIncome: 50000,
          totalExpenses: 30000,
          totalTransfers: 0,
          netAmount: 20000,
          transactionCount: 100
        },
        categories: [],
        trends: [],
        projections: [],
        insights: []
      };

      service.generateFinancialReport(options).subscribe(report => {
        expect(report).toEqual(mockReport);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/financial/reports`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(options);
      req.flush({ success: true, data: mockReport });
    });
  });

  describe('getBudgetAnalysis', () => {
    it('should get budget analysis', () => {
      const options = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        categoryId: 'cat1'
      };

      const mockAnalysis: BudgetAnalysis = {
        currentSpending: {
          total: 30000,
          byCategory: [],
          vsBudget: []
        },
        recommendations: [],
        alerts: []
      };

      service.getBudgetAnalysis(options).subscribe(analysis => {
        expect(analysis).toEqual(mockAnalysis);
      });

      const req = httpMock.expectOne(request => 
        request.url === `${environment.apiUrl}/financial/budget-analysis` &&
        request.params.get('startDate') === options.startDate.toISOString() &&
        request.params.get('endDate') === options.endDate.toISOString() &&
        request.params.get('categoryId') === options.categoryId
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockAnalysis });
    });
  });

  describe('getFinancialInsights', () => {
    it('should get financial insights', () => {
      const options = {
        period: 'month' as const,
        includePredictions: true
      };

      const mockInsights: FinancialInsights = {
        period: 'month',
        insights: [],
        trends: [],
        predictions: []
      };

      service.getFinancialInsights(options).subscribe(insights => {
        expect(insights).toEqual(mockInsights);
      });

      const req = httpMock.expectOne(request => 
        request.url === `${environment.apiUrl}/financial/insights` &&
        request.params.get('period') === options.period &&
        request.params.get('includePredictions') === options.includePredictions.toString()
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockInsights });
    });
  });

  describe('exportFinancialData', () => {
    it('should export financial data', () => {
      const options = {
        format: 'csv' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        includeCategories: true,
        includeTransactions: true,
        includeStats: false
      };

      const mockExport = {
        format: 'csv',
        data: 'csv-data',
        filename: 'financial-report-2024.csv',
        downloadUrl: 'http://example.com/download'
      };

      service.exportFinancialData(options).subscribe(exportData => {
        expect(exportData).toEqual(mockExport);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/financial/export`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(options);
      req.flush({ success: true, data: mockExport });
    });
  });

  describe('getFinancialSummary', () => {
    it('should get financial summary', () => {
      const options = { period: 'month' };

      const mockSummary = {
        totalBalance: 10000,
        monthlyIncome: 5000,
        monthlyExpenses: 3000
      };

      service.getFinancialSummary(options).subscribe(summary => {
        expect(summary).toEqual(mockSummary);
      });

      const req = httpMock.expectOne(request => 
        request.url === `${environment.apiUrl}/financial/summary` &&
        request.params.get('period') === options.period
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockSummary });
    });
  });

  describe('refreshDashboard', () => {
    it('should refresh dashboard data', () => {
      service.refreshDashboard().subscribe(dashboard => {
        expect(dashboard).toEqual(mockDashboard);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/financial/dashboard`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockDashboard });
    });
  });

  describe('State Management', () => {
    it('should provide dashboard state observable', () => {
      service.dashboardState$.subscribe(state => {
        expect(state).toBeDefined();
        expect(state.dashboard).toBeNull();
        expect(state.isLoading).toBe(false);
        expect(state.error).toBeNull();
      });
    });

    it('should provide loading state observable', () => {
      service.isLoading$.subscribe(isLoading => {
        expect(typeof isLoading).toBe('boolean');
      });
    });

    it('should provide error state observable', () => {
      service.error$.subscribe(error => {
        expect(error).toBeDefined();
      });
    });

    it('should get current dashboard state', () => {
      const state = service.getCurrentDashboardState();
      expect(state).toBeDefined();
      expect(state.dashboard).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should clear dashboard cache', () => {
      service.clearDashboardCache();
      const state = service.getCurrentDashboardState();
      expect(state.dashboard).toBeNull();
      expect(state.lastUpdated).toBeNull();
    });
  });
});
