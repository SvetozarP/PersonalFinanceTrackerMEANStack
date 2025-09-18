import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GlobalSearchService, SearchResult, SearchSuggestion } from './global-search.service';
import { TransactionService } from './transaction.service';
import { BudgetService } from './budget.service';
import { CategoryService } from './category.service';
import { of } from 'rxjs';

describe('GlobalSearchService', () => {
  let service: GlobalSearchService;
  let transactionService: jasmine.SpyObj<TransactionService>;
  let budgetService: jasmine.SpyObj<BudgetService>;
  let categoryService: jasmine.SpyObj<CategoryService>;

  const mockSearchResult: SearchResult = {
    id: '1',
    title: 'Test Transaction',
    description: 'Test Description',
    type: 'transaction',
    url: '/transactions/1',
    icon: 'fas fa-receipt',
    relevanceScore: 90,
    metadata: {
      amount: 100,
      date: '2024-01-01'
    }
  };

  const mockSearchSuggestion: SearchSuggestion = {
    id: 'suggestion1',
    text: 'test search',
    type: 'suggestion',
    category: 'transactions',
    count: 5
  };

  beforeEach(() => {
    const transactionServiceSpy = jasmine.createSpyObj('TransactionService', ['getUserTransactions']);
    const budgetServiceSpy = jasmine.createSpyObj('BudgetService', ['getBudgets']);
    const categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getUserCategories']);

    // Setup default return values
    transactionServiceSpy.getUserTransactions.and.returnValue(of({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
    }));
    budgetServiceSpy.getBudgets.and.returnValue(of({ budgets: [] }));
    categoryServiceSpy.getUserCategories.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        GlobalSearchService,
        { provide: TransactionService, useValue: transactionServiceSpy },
        { provide: BudgetService, useValue: budgetServiceSpy },
        { provide: CategoryService, useValue: categoryServiceSpy }
      ]
    });

    service = TestBed.inject(GlobalSearchService);
    transactionService = TestBed.inject(TransactionService) as jasmine.SpyObj<TransactionService>;
    budgetService = TestBed.inject(BudgetService) as jasmine.SpyObj<BudgetService>;
    categoryService = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Search Functionality', () => {
    it('should perform global search', (done) => {
      const query = 'test';
      
      service.search(query).subscribe(results => {
        expect(Array.isArray(results)).toBe(true);
        done();
      });
    });

    it('should return empty results for empty query', (done) => {
      service.search('').subscribe(results => {
        expect(results).toEqual([]);
        done();
      });
    });

    it('should return empty results for whitespace-only query', (done) => {
      service.search('   ').subscribe(results => {
        expect(results).toEqual([]);
        done();
      });
    });
  });

  describe('Search Suggestions', () => {
    it('should get search suggestions', (done) => {
      const query = 'test';
      
      service.getSuggestions(query).subscribe(suggestions => {
        expect(Array.isArray(suggestions)).toBe(true);
        done();
      });
    });

    it('should return empty suggestions for short queries', (done) => {
      service.getSuggestions('a').subscribe(suggestions => {
        expect(suggestions).toEqual([]);
        done();
      });
    });
  });

  describe('Search History', () => {
    it('should add to search history', () => {
      const query = 'test query';
      (service as any).addToSearchHistory(query);
      
      const history = service.getSearchHistory();
      expect(history).toContain(query);
    });

    it('should not add duplicate queries', () => {
      const query = 'test query';
      (service as any).addToSearchHistory(query);
      (service as any).addToSearchHistory(query);
      
      const history = service.getSearchHistory();
      const count = history.filter(h => h === query).length;
      expect(count).toBe(1);
    });

    it('should limit search history size', () => {
      // Add more than the limit (50)
      for (let i = 0; i < 55; i++) {
        (service as any).addToSearchHistory(`query ${i}`);
      }
      
      const history = service.getSearchHistory();
      expect(history.length).toBe(50);
    });

    it('should clear search history', () => {
      (service as any).addToSearchHistory('test query');
      service.clearSearchHistory();
      
      const history = service.getSearchHistory();
      expect(history).toEqual([]);
    });
  });

  describe('Search State Management', () => {
    it('should clear search results and query', () => {
      service.clearSearch();
      
      expect(service.searchQuery()).toBe('');
      expect(service.searchResults()).toEqual([]);
      expect(service.searchSuggestions()).toEqual([]);
    });

    it('should update search filters', () => {
      const filters = { types: ['transaction'] };
      service.updateFilters(filters);
      
      expect(service.searchFilters().types).toEqual(['transaction']);
    });
  });

  describe('Export/Import', () => {
    it('should export search configuration', () => {
      const config = service.exportSearchConfig();
      const parsed = JSON.parse(config);
      
      expect(parsed.searchHistory).toBeDefined();
      expect(parsed.searchFilters).toBeDefined();
      expect(parsed.version).toBe('1.0');
    });

    it('should import search configuration', () => {
      const config = {
        searchHistory: ['test query'],
        searchFilters: { types: ['transaction'] },
        version: '1.0'
      };
      
      const success = service.importSearchConfig(JSON.stringify(config));
      expect(success).toBe(true);
    });

    it('should handle invalid JSON import', () => {
      const success = service.importSearchConfig('invalid json');
      expect(success).toBe(false);
    });
  });

  describe('Computed Properties', () => {
    it('should compute has results', () => {
      expect(service.hasResults()).toBe(false);
    });

    it('should compute result count', () => {
      expect(service.resultCount()).toBe(0);
    });

    it('should compute search summary', () => {
      const summary = service.searchSummary();
      expect(typeof summary).toBe('string');
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', () => {
      transactionService.getUserTransactions.and.throwError('Service error');
      
      expect(() => {
        service.search('test').subscribe();
      }).not.toThrow();
    });
  });

  describe('Advanced Search Functionality', () => {
    it('should search with filters', (done) => {
      const query = 'test';
      const filters = { types: ['transaction', 'budget'] };
      
      service.search(query, filters).subscribe(results => {
        expect(Array.isArray(results)).toBe(true);
        done();
      });
    });

    it('should search transactions specifically', (done) => {
      const mockTransactions = {
        data: [
          {
            _id: '1',
            title: 'Test Transaction',
            amount: 100,
            currency: 'USD',
            type: 'expense' as any,
            status: 'completed' as any,
            categoryId: 'cat1',
            tags: [],
            date: new Date('2024-01-01'),
            timezone: 'UTC',
            paymentMethod: 'debit_card' as any,
            attachments: [],
            source: 'manual',
            userId: 'user1',
            accountId: 'account1',
            isRecurring: false,
            recurrencePattern: 'none' as any,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: undefined,
            isDeleted: false
          }
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
      };
      
      transactionService.getUserTransactions.and.returnValue(of(mockTransactions));
      
      service.search('test').subscribe(results => {
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].type).toBe('transaction');
        done();
      });
    });

    it('should search budgets specifically', (done) => {
      const mockBudgets = {
        budgets: [
          {
            _id: '1',
            name: 'Test Budget',
            description: 'Test Description',
            period: 'monthly' as any,
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
            totalAmount: 1000,
            currency: 'USD',
            categoryAllocations: [],
            status: 'active' as any,
            alertThreshold: 80,
            userId: 'user1',
            isActive: true,
            autoAdjust: false,
            allowRollover: false,
            rolloverAmount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        total: 1,
        page: 1,
        totalPages: 1
      };
      
      budgetService.getBudgets.and.returnValue(of(mockBudgets));
      
      service.search('test').subscribe(results => {
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].type).toBe('budget');
        done();
      });
    });

    it('should search categories specifically', (done) => {
      const mockCategories = [
        {
          _id: '1',
          name: 'Test Category',
          path: ['Test Category'],
          level: 1,
          isActive: true,
          isSystem: false,
          color: '#ff6b6b',
          userId: 'user1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      categoryService.getUserCategories.and.returnValue(of(mockCategories));
      
      service.search('test').subscribe(results => {
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].type).toBe('category');
        done();
      });
    });
  });

  describe('Search Suggestions - Extended', () => {
    it('should get common suggestions', (done) => {
      service.getSuggestions('in').subscribe(suggestions => {
        expect(Array.isArray(suggestions)).toBe(true);
        done();
      });
    });

    it('should get category suggestions', (done) => {
      const mockCategories = [
        {
          _id: '1',
          name: 'Food & Dining',
          path: ['Food & Dining'],
          level: 1,
          isActive: true,
          isSystem: false,
          color: '#ff6b6b',
          userId: 'user1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      categoryService.getUserCategories.and.returnValue(of(mockCategories));
      
      service.getSuggestions('food').subscribe(suggestions => {
        expect(Array.isArray(suggestions)).toBe(true);
        done();
      });
    });

    it('should return recent searches as suggestions', (done) => {
      // Add some recent searches
      (service as any).addToSearchHistory('recent search 1');
      (service as any).addToSearchHistory('recent search 2');
      
      service.getSuggestions('recent').subscribe(suggestions => {
        expect(Array.isArray(suggestions)).toBe(true);
        done();
      });
    });
  });

  describe('Search State Management - Extended', () => {
    it('should clear search results and query', () => {
      service.clearSearch();
      
      expect(service.searchQuery()).toBe('');
      expect(service.searchResults()).toEqual([]);
      expect(service.searchSuggestions()).toEqual([]);
    });
  });

  describe('Search History - Extended', () => {
    it('should add to search history', () => {
      const query = 'test query';
      (service as any).addToSearchHistory(query);
      
      const history = service.getSearchHistory();
      expect(history).toContain(query);
    });

    it('should limit search history size', () => {
      // Add more than the limit (50)
      for (let i = 0; i < 55; i++) {
        (service as any).addToSearchHistory(`query ${i}`);
      }
      
      const history = service.getSearchHistory();
      expect(history.length).toBe(50);
    });

    it('should clear search history', () => {
      (service as any).addToSearchHistory('test query');
      service.clearSearchHistory();
      
      const history = service.getSearchHistory();
      expect(history).toEqual([]);
    });
  });

  describe('Search Filters - Extended', () => {
    it('should update search filters with date range', () => {
      const filters = {
        types: ['transaction'],
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        }
      };
      
      service.updateFilters(filters);
      
      expect(service.searchFilters().types).toEqual(['transaction']);
      expect(service.searchFilters().dateRange).toBeDefined();
    });

    it('should update search filters with categories', () => {
      const filters = {
        types: ['transaction'],
        categories: ['cat1', 'cat2']
      };
      
      service.updateFilters(filters);
      
      expect(service.searchFilters().categories).toEqual(['cat1', 'cat2']);
    });

    it('should update search filters with amount range', () => {
      const filters = {
        types: ['transaction'],
        amountRange: {
          min: 100,
          max: 1000
        }
      };
      
      service.updateFilters(filters);
      
      expect(service.searchFilters().amountRange).toBeDefined();
      expect(service.searchFilters().amountRange?.min).toBe(100);
      expect(service.searchFilters().amountRange?.max).toBe(1000);
    });

    it('should update search filters multiple times', () => {
      service.updateFilters({ types: ['transaction'] });
      service.updateFilters({ categories: ['cat1'] });
      
      expect(service.searchFilters().types).toEqual(['transaction']);
      expect(service.searchFilters().categories).toEqual(['cat1']);
    });
  });

  describe('Export/Import - Extended', () => {
    it('should export search configuration with all data', () => {
      // Add some data
      (service as any).addToSearchHistory('test query');
      service.updateFilters({ types: ['transaction'] });
      
      const config = service.exportSearchConfig();
      const parsed = JSON.parse(config);
      
      expect(parsed.searchHistory).toContain('test query');
      expect(parsed.searchFilters.types).toEqual(['transaction']);
      expect(parsed.version).toBe('1.0');
    });

    it('should import search configuration with all data', () => {
      const config = {
        searchHistory: ['imported query'],
        searchFilters: { types: ['budget'] },
        version: '1.0'
      };
      
      const success = service.importSearchConfig(JSON.stringify(config));
      expect(success).toBe(true);
      
      expect(service.getSearchHistory()).toContain('imported query');
      expect(service.searchFilters().types).toEqual(['budget']);
    });

    it('should handle malformed JSON import', () => {
      const success = service.importSearchConfig('{ invalid json }');
      expect(success).toBe(false);
    });

    it('should handle import with missing properties', () => {
      const config = { version: '1.0' };
      const success = service.importSearchConfig(JSON.stringify(config));
      expect(success).toBe(true);
    });
  });

  describe('Computed Properties - Extended', () => {
    it('should compute has results correctly', () => {
      expect(service.hasResults()).toBe(false);
    });

    it('should compute result count correctly', () => {
      expect(service.resultCount()).toBe(0);
    });

    it('should compute search summary without results', () => {
      const summary = service.searchSummary();
      expect(summary).toBe('No results found');
    });
  });

  describe('Private Methods - Indirect Testing', () => {
    it('should calculate relevance score correctly', () => {
      const score1 = (service as any).calculateRelevanceScore('test transaction', 'test');
      const score2 = (service as any).calculateRelevanceScore('different text', 'test');
      
      expect(score1).toBeGreaterThan(score2);
    });

    it('should sort results by relevance', () => {
      const results = [
        { ...mockSearchResult, relevanceScore: 50 },
        { ...mockSearchResult, relevanceScore: 90 }
      ];
      
      const sorted = (service as any).sortResultsByRelevance(results, 'test');
      expect(sorted[0].relevanceScore).toBe(90);
      expect(sorted[1].relevanceScore).toBe(50);
    });

    it('should get transaction icon correctly', () => {
      const incomeIcon = (service as any).getTransactionIcon('income');
      const expenseIcon = (service as any).getTransactionIcon('expense');
      
      expect(incomeIcon).toBe('fas fa-arrow-up');
      expect(expenseIcon).toBe('fas fa-arrow-down');
    });

    it('should check cache validity', () => {
      const isValid = (service as any).isCacheValid('test-key');
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined queries', (done) => {
      service.search('').subscribe(results => {
        expect(results).toEqual([]);
        done();
      });
    });

    it('should handle very long queries', (done) => {
      const longQuery = 'a'.repeat(1000);
      service.search(longQuery).subscribe(results => {
        expect(Array.isArray(results)).toBe(true);
        done();
      });
    });

    it('should handle special characters in queries', (done) => {
      const specialQuery = 'test@#$%^&*()_+{}|:"<>?[]\\;\',./';
      service.search(specialQuery).subscribe(results => {
        expect(Array.isArray(results)).toBe(true);
        done();
      });
    });
  });
});