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
});