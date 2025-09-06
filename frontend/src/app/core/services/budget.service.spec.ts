import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { BudgetService, Budget, CreateBudgetDto, UpdateBudgetDto, BudgetFilters, BudgetAnalytics, BudgetSummary, BudgetStatistics, CategoryAllocation } from './budget.service';
import { provideZoneChangeDetection } from '@angular/core';
import { of, throwError } from 'rxjs';

describe('BudgetService', () => {
  let service: BudgetService;
  let httpMock: HttpTestingController;
  let httpClient: jasmine.SpyObj<HttpClient>;

  const mockBudget: Budget = {
    _id: '1',
    name: 'Test Budget',
    description: 'Test Description',
    period: 'monthly',
    startDate: new Date('2023-01-01'),
    endDate: new Date('2023-01-31'),
    totalAmount: 5000,
    currency: 'USD',
    categoryAllocations: [
      {
        categoryId: 'cat1',
        allocatedAmount: 2000,
        isFlexible: true,
        priority: 1
      }
    ],
    status: 'active',
    alertThreshold: 80,
    userId: 'user1',
    isActive: true,
    autoAdjust: false,
    allowRollover: true,
    rolloverAmount: 0,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };

  const mockCreateDto: CreateBudgetDto = {
    name: 'New Budget',
    description: 'New Description',
    period: 'monthly',
    startDate: new Date('2023-02-01'),
    endDate: new Date('2023-02-28'),
    totalAmount: 3000,
    currency: 'USD',
    categoryAllocations: [
      {
        categoryId: 'cat1',
        allocatedAmount: 1500,
        isFlexible: true,
        priority: 1
      }
    ],
    alertThreshold: 75,
    autoAdjust: true,
    allowRollover: false
  };

  const mockAnalytics: BudgetAnalytics = {
    budgetId: '1',
    totalAllocated: 5000,
    totalSpent: 3000,
    totalRemaining: 2000,
    progressPercentage: 60,
    isOverBudget: false,
    categoryBreakdown: [],
    spendingTrend: [],
    alerts: []
  };

  const mockSummary: BudgetSummary = {
    totalBudgetAmount: 10000,
    totalSpentAmount: 6000,
    totalRemainingAmount: 4000,
    activeBudgetCount: 3,
    overBudgetCount: 1,
    upcomingDeadlines: []
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        BudgetService,
        provideZoneChangeDetection()
      ]
    });
    
    service = TestBed.inject(BudgetService);
    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Observables', () => {
    it('should provide budgets observable', (done) => {
      service.budgets$.subscribe(budgets => {
        expect(Array.isArray(budgets)).toBe(true);
        done();
      });
    });

    it('should provide budget summary observable', (done) => {
      service.budgetSummary$.subscribe(summary => {
        expect(summary).toBeDefined();
        done();
      });
    });

    it('should provide budget analytics observable', (done) => {
      service.budgetAnalytics$.subscribe(analytics => {
        expect(analytics).toBeDefined();
        done();
      });
    });
  });

  describe('CRUD Operations', () => {
    it('should create budget', (done) => {
      service.createBudget(mockCreateDto).subscribe(budget => {
        expect(budget).toEqual(mockBudget);
        done();
      });

      const req = httpMock.expectOne(`${service['baseUrl']}`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: mockBudget });
    });

    it('should get budgets with filters', (done) => {
      const filters: BudgetFilters = { status: 'active', period: 'monthly' };
      const response = { budgets: [mockBudget], total: 1, page: 1, totalPages: 1 };

      service.getBudgets(filters, 1, 20, 'createdAt', 'desc').subscribe(result => {
        expect(result).toEqual(response);
        done();
      });

      const req = httpMock.expectOne((request) => {
        return request.url === service['baseUrl'] &&
               request.params.get('status') === 'active' &&
               request.params.get('period') === 'monthly' &&
               request.params.get('page') === '1' &&
               request.params.get('limit') === '20' &&
               request.params.get('sortBy') === 'createdAt' &&
               request.params.get('sortOrder') === 'desc';
      });
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: response });
    });

    it('should get budget by ID with analytics', (done) => {
      service.getBudgetById('1').subscribe(analytics => {
        expect(analytics).toEqual(mockAnalytics);
        done();
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/1/analytics`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockAnalytics });
    });

    it('should update budget', (done) => {
      const updateData: UpdateBudgetDto = { name: 'Updated Budget' };
      const updatedBudget = { ...mockBudget, name: 'Updated Budget' };

      service.updateBudget('1', updateData).subscribe(budget => {
        expect(budget).toEqual(updatedBudget);
        done();
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/1`);
      expect(req.request.method).toBe('PUT');
      req.flush({ success: true, data: updatedBudget });
    });

    it('should delete budget', (done) => {
      service.deleteBudget('1').subscribe(result => {
        expect(result).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, data: true });
    });
  });

  describe('Summary and Analytics', () => {
    it('should get budget summary', (done) => {
      service.getBudgetSummary().subscribe(summary => {
        expect(summary).toEqual(mockSummary);
        done();
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/summary`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockSummary });
    });

    it('should get budget statistics', (done) => {
      const mockStats: BudgetStatistics = {
        monthlyStats: [],
        categoryStats: [],
        spendingPatterns: []
      };

      service.getBudgetStatistics(2023).subscribe(stats => {
        expect(stats).toEqual(mockStats);
        done();
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/statistics?year=2023`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockStats });
    });

    it('should check budget alerts', (done) => {
      const mockAlerts = [
        {
          type: 'threshold' as const,
          message: 'Budget threshold reached',
          severity: 'medium' as const,
          currentAmount: 80,
          limitAmount: 75
        }
      ];

      service.checkBudgetAlerts().subscribe(alerts => {
        expect(alerts).toEqual(mockAlerts);
        done();
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/alerts`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockAlerts });
    });

    it('should get budget analytics', (done) => {
      service.getBudgetAnalytics('1').subscribe(analytics => {
        expect(analytics).toEqual(mockAnalytics);
        done();
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/1/analytics`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockAnalytics });
    });
  });

  describe('State Management', () => {
    it('should refresh budgets', () => {
      spyOn(service, 'getBudgets').and.returnValue(of({ budgets: [], total: 0, page: 1, totalPages: 0 }));
      
      service.refreshBudgets();
      
      expect(service.getBudgets).toHaveBeenCalled();
    });

    it('should refresh budget summary', () => {
      spyOn(service, 'getBudgetSummary').and.returnValue(of(mockSummary));
      
      service.refreshBudgetSummary();
      
      expect(service.getBudgetSummary).toHaveBeenCalled();
    });

    it('should get current budgets from state', () => {
      service['budgetsSubject'].next([mockBudget]);
      
      const currentBudgets = service.getCurrentBudgets();
      expect(currentBudgets).toEqual([mockBudget]);
    });

    it('should get current budget summary from state', () => {
      service['budgetSummarySubject'].next(mockSummary);
      
      const currentSummary = service.getCurrentBudgetSummary();
      expect(currentSummary).toEqual(mockSummary);
    });

    it('should get budget analytics from state', () => {
      const analyticsMap = new Map();
      analyticsMap.set('1', mockAnalytics);
      service['budgetAnalyticsSubject'].next(analyticsMap);
      
      const analytics = service.getBudgetAnalyticsFromState('1');
      expect(analytics).toEqual(mockAnalytics);
    });
  });

  describe('Utility Methods', () => {
    it('should calculate total allocated amount', () => {
      const allocations: CategoryAllocation[] = [
        { categoryId: 'cat1', allocatedAmount: 1000, isFlexible: true, priority: 1 },
        { categoryId: 'cat2', allocatedAmount: 2000, isFlexible: false, priority: 2 }
      ];

      const total = service.calculateTotalAllocated(allocations);
      expect(total).toBe(3000);
    });

    it('should validate budget data', () => {
      const validData: CreateBudgetDto = {
        name: 'Valid Budget',
        period: 'monthly',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31'),
        totalAmount: 5000,
        categoryAllocations: [
          { categoryId: 'cat1', allocatedAmount: 5000, isFlexible: true, priority: 1 }
        ]
      };

      const result = service.validateBudgetData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate budget data with errors', () => {
      const invalidData: CreateBudgetDto = {
        name: '',
        period: 'monthly',
        startDate: new Date('2023-01-31'),
        endDate: new Date('2023-01-01'),
        totalAmount: -100,
        categoryAllocations: []
      };

      const result = service.validateBudgetData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should generate suggested allocations', () => {
      const totalAmount = 10000;
      const historicalSpending = [
        { categoryId: 'cat1', amount: 3000, percentage: 30 },
        { categoryId: 'cat2', amount: 7000, percentage: 70 }
      ];

      const allocations = service.generateSuggestedAllocations(totalAmount, historicalSpending);
      
      expect(allocations.length).toBe(2);
      expect(allocations[0].allocatedAmount).toBe(3000);
      expect(allocations[1].allocatedAmount).toBe(7000);
    });

    it('should calculate budget period dates for monthly', () => {
      const baseDate = new Date('2023-06-15');
      const result = service.calculateBudgetPeriodDates('monthly', baseDate);
      
      expect(result.startDate.getMonth()).toBe(5); // June (0-indexed)
      expect(result.startDate.getDate()).toBe(1);
      expect(result.endDate.getMonth()).toBe(5); // June
      expect(result.endDate.getDate()).toBe(30);
    });

    it('should calculate budget period dates for yearly', () => {
      const baseDate = new Date('2023-06-15');
      const result = service.calculateBudgetPeriodDates('yearly', baseDate);
      
      expect(result.startDate.getFullYear()).toBe(2023);
      expect(result.startDate.getMonth()).toBe(0); // January
      expect(result.startDate.getDate()).toBe(1);
      expect(result.endDate.getFullYear()).toBe(2023);
      expect(result.endDate.getMonth()).toBe(11); // December
      expect(result.endDate.getDate()).toBe(31);
    });

    it('should calculate budget period dates for custom', () => {
      const baseDate = new Date('2023-06-15');
      const result = service.calculateBudgetPeriodDates('custom', baseDate);
      
      expect(result.startDate).toEqual(baseDate);
      expect(result.endDate.getTime() - baseDate.getTime()).toBe(30 * 24 * 60 * 60 * 1000);
    });
  });

  describe('Error Handling', () => {
    it('should handle create budget error', (done) => {
      service.createBudget(mockCreateDto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });

      const req = httpMock.expectOne(`${service['baseUrl']}`);
      req.flush({ success: false, message: 'Error creating budget' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle get budgets error', (done) => {
      service.getBudgets().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });

      const req = httpMock.expectOne(`${service['baseUrl']}?page=1&limit=20&sortBy=createdAt&sortOrder=desc`);
      req.flush({ success: false, message: 'Error fetching budgets' }, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle update budget error', (done) => {
      service.updateBudget('1', { name: 'Updated' }).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/1`);
      req.flush({ success: false, message: 'Error updating budget' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle delete budget error', (done) => {
      service.deleteBudget('1').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/1`);
      req.flush({ success: false, message: 'Error deleting budget' }, { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('Filter Parameters', () => {
    it('should handle date filters correctly', (done) => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const filters: BudgetFilters = { startDate, endDate };

      service.getBudgets(filters).subscribe((response) => {
        expect(response).toBeDefined();
        expect(response.budgets).toEqual([]);
        expect(response.total).toBe(0);
        expect(response.page).toBe(1);
        expect(response.totalPages).toBe(0);
        done();
      });

      const req = httpMock.expectOne((request) => {
        return request.url === service['baseUrl'] &&
               request.params.get('startDate') === '2023-01-01T00:00:00.000Z' &&
               request.params.get('endDate') === '2023-12-31T00:00:00.000Z' &&
               request.params.get('page') === '1' &&
               request.params.get('limit') === '20' &&
               request.params.get('sortBy') === 'createdAt' &&
               request.params.get('sortOrder') === 'desc';
      });
      req.flush({ success: true, data: { budgets: [], total: 0, page: 1, totalPages: 0 } });
    });

    it('should handle string filters correctly', (done) => {
      const filters: BudgetFilters = { status: 'active', search: 'test' };

      service.getBudgets(filters).subscribe((response) => {
        expect(response).toBeDefined();
        expect(response.budgets).toEqual([]);
        expect(response.total).toBe(0);
        expect(response.page).toBe(1);
        expect(response.totalPages).toBe(0);
        done();
      });

      const req = httpMock.expectOne((request) => {
        return request.url === service['baseUrl'] &&
               request.params.get('status') === 'active' &&
               request.params.get('search') === 'test' &&
               request.params.get('page') === '1' &&
               request.params.get('limit') === '20' &&
               request.params.get('sortBy') === 'createdAt' &&
               request.params.get('sortOrder') === 'desc';
      });
      req.flush({ success: true, data: { budgets: [], total: 0, page: 1, totalPages: 0 } });
    });

    it('should ignore null/undefined/empty filters', (done) => {
      const filters: BudgetFilters = { 
        status: 'active', 
        period: '', 
        search: undefined,
        startDate: null as any
      };

      service.getBudgets(filters).subscribe((response) => {
        expect(response).toBeDefined();
        expect(response.budgets).toEqual([]);
        expect(response.total).toBe(0);
        expect(response.page).toBe(1);
        expect(response.totalPages).toBe(0);
        done();
      });

      const req = httpMock.expectOne((request) => {
        return request.url === service['baseUrl'] &&
               request.params.get('status') === 'active' &&
               request.params.get('period') === null && // Empty string filtered out
               request.params.get('search') === null && // Undefined filtered out
               request.params.get('startDate') === null && // Null filtered out
               request.params.get('page') === '1' &&
               request.params.get('limit') === '20' &&
               request.params.get('sortBy') === 'createdAt' &&
               request.params.get('sortOrder') === 'desc';
      });
      req.flush({ success: true, data: { budgets: [], total: 0, page: 1, totalPages: 0 } });
    });
  });
});
