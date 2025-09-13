import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { StorageService } from './storage.service';
import { TransactionService } from './transaction.service';
import { BudgetService } from './budget.service';
import { CategoryService } from './category.service';

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: 'transaction' | 'budget' | 'category' | 'report';
  category?: string;
  url: string;
  icon: string;
  relevanceScore: number;
  metadata?: any;
}

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'suggestion' | 'category' | 'tag' | 'budget' | 'transaction';
  category?: string;
  count?: number;
  lastUsed?: Date;
  icon?: string;
}

export interface SearchFilters {
  types: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  categories?: string[];
  amountRange?: {
    min: number;
    max: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class GlobalSearchService {
  private storageService = new StorageService();
  
  // State management
  private _searchQuery = signal('');
  private _searchResults = signal<SearchResult[]>([]);
  private _searchSuggestions = signal<SearchSuggestion[]>([]);
  private _isSearching = signal(false);
  private _searchHistory = signal<string[]>([]);
  private _recentSearches = signal<SearchSuggestion[]>([]);
  private _searchFilters = signal<SearchFilters>({
    types: ['transaction', 'budget', 'category']
  });

  // Public observables
  public searchQuery = this._searchQuery.asReadonly();
  public searchResults = this._searchResults.asReadonly();
  public searchSuggestions = this._searchSuggestions.asReadonly();
  public isSearching = this._isSearching.asReadonly();
  public searchHistory = this._searchHistory.asReadonly();
  public recentSearches = this._recentSearches.asReadonly();
  public searchFilters = this._searchFilters.asReadonly();

  // Computed properties
  public hasResults = computed(() => this._searchResults().length > 0);
  public resultCount = computed(() => this._searchResults().length);
  public searchSummary = computed(() => this.generateSearchSummary());

  // Search suggestions cache
  private suggestionsCache = new Map<string, SearchSuggestion[]>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private cacheTimestamps = new Map<string, number>();

  constructor(
    private transactionService: TransactionService,
    private budgetService: BudgetService,
    private categoryService: CategoryService
  ) {
    this.loadSearchHistory();
    this.loadRecentSearches();
  }

  /**
   * Perform a global search across all data types
   */
  search(query: string, filters?: Partial<SearchFilters>): Observable<SearchResult[]> {
    if (!query.trim()) {
      this._searchResults.set([]);
      return of([]);
    }

    this._searchQuery.set(query);
    this._isSearching.set(true);

    // Update filters if provided
    if (filters) {
      this._searchFilters.update(current => ({ ...current, ...filters }));
    }

    const currentFilters = this._searchFilters();
    const searchObservables: Observable<SearchResult[]>[] = [];

    // Search transactions
    if (currentFilters.types.includes('transaction')) {
      searchObservables.push(this.searchTransactions(query, currentFilters));
    }

    // Search budgets
    if (currentFilters.types.includes('budget')) {
      searchObservables.push(this.searchBudgets(query, currentFilters));
    }

    // Search categories
    if (currentFilters.types.includes('category')) {
      searchObservables.push(this.searchCategories(query, currentFilters));
    }

    // Combine all search results
    return combineLatest(searchObservables).pipe(
      map(results => {
        const allResults = results.flat();
        const sortedResults = this.sortResultsByRelevance(allResults, query);
        this._searchResults.set(sortedResults);
        this._isSearching.set(false);
        this.addToSearchHistory(query);
        return sortedResults;
      })
    );
  }

  /**
   * Get search suggestions based on query
   */
  getSuggestions(query: string): Observable<SearchSuggestion[]> {
    if (!query.trim()) {
      this._searchSuggestions.set([]);
      return of([]);
    }

    // Check cache first
    const cacheKey = query.toLowerCase();
    if (this.isCacheValid(cacheKey)) {
      const cached = this.suggestionsCache.get(cacheKey);
      if (cached) {
        this._searchSuggestions.set(cached);
        return of(cached);
      }
    }

    // Generate suggestions
    const suggestions: SearchSuggestion[] = [];

    // Add recent searches
    const recentMatches = this._searchHistory()
      .filter(search => search.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3)
      .map(search => ({
        id: `recent-${search}`,
        text: search,
        type: 'recent' as const,
        lastUsed: new Date(),
        icon: 'fas fa-history'
      }));

    suggestions.push(...recentMatches);

    // Add common suggestions
    const commonSuggestions = this.getCommonSuggestions(query);
    suggestions.push(...commonSuggestions);

    // Add category suggestions
    const categorySuggestions = this.getCategorySuggestions(query);
    suggestions.push(...categorySuggestions);

    // Cache the results
    this.suggestionsCache.set(cacheKey, suggestions);
    this.cacheTimestamps.set(cacheKey, Date.now());

    this._searchSuggestions.set(suggestions);
    return of(suggestions);
  }

  /**
   * Clear search results and query
   */
  clearSearch(): void {
    this._searchQuery.set('');
    this._searchResults.set([]);
    this._searchSuggestions.set([]);
  }

  /**
   * Update search filters
   */
  updateFilters(filters: Partial<SearchFilters>): void {
    this._searchFilters.update(current => ({ ...current, ...filters }));
  }

  /**
   * Get search history
   */
  getSearchHistory(): string[] {
    return this._searchHistory();
  }

  /**
   * Clear search history
   */
  clearSearchHistory(): void {
    this._searchHistory.set([]);
    this.saveSearchHistory();
  }

  /**
   * Export search configuration
   */
  exportSearchConfig(): string {
    const config = {
      searchHistory: this._searchHistory(),
      recentSearches: this._recentSearches(),
      searchFilters: this._searchFilters(),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(config, null, 2);
  }

  /**
   * Import search configuration
   */
  importSearchConfig(configJson: string): boolean {
    try {
      const config = JSON.parse(configJson);
      
      if (config.searchHistory) {
        this._searchHistory.set(config.searchHistory);
      }
      
      if (config.recentSearches) {
        this._recentSearches.set(config.recentSearches);
      }
      
      if (config.searchFilters) {
        this._searchFilters.set(config.searchFilters);
      }
      
      this.saveSearchHistory();
      this.saveRecentSearches();
      return true;
    } catch (error) {
      console.error('Failed to import search config:', error);
      return false;
    }
  }

  // Private methods
  private searchTransactions(query: string, filters: SearchFilters): Observable<SearchResult[]> {
    return this.transactionService.getUserTransactions({
      search: query,
      startDate: filters.dateRange?.start,
      endDate: filters.dateRange?.end,
      categoryId: filters.categories?.[0]
    }).pipe(
      map(response => {
        return (response.data || []).map(transaction => ({
          id: transaction._id,
          title: transaction.title,
          description: transaction.description,
          type: 'transaction' as const,
          category: transaction.categoryId,
          url: `/financial/transactions/${transaction._id}`,
          icon: this.getTransactionIcon(transaction.type),
          relevanceScore: this.calculateRelevanceScore(transaction.title, query),
          metadata: {
            amount: transaction.amount,
            date: transaction.date,
            type: transaction.type,
            status: transaction.status
          }
        }));
      })
    );
  }

  private searchBudgets(query: string, filters: SearchFilters): Observable<SearchResult[]> {
    return this.budgetService.getBudgets().pipe(
      map(response => {
        return (response.budgets || []).map(budget => ({
          id: budget._id,
          title: budget.name,
          description: budget.description,
          type: 'budget' as const,
          url: `/financial/budgets/${budget._id}`,
          icon: 'fas fa-piggy-bank',
          relevanceScore: this.calculateRelevanceScore(budget.name, query),
          metadata: {
            amount: budget.totalAmount,
            period: budget.period,
            status: budget.status,
            isActive: budget.isActive
          }
        }));
      })
    );
  }

  private searchCategories(query: string, filters: SearchFilters): Observable<SearchResult[]> {
    return this.categoryService.getUserCategories().pipe(
      map(categories => {
        return (categories || []).map(category => ({
          id: category._id,
          title: category.name,
          description: category.description,
          type: 'category' as const,
          url: `/financial/categories/${category._id}`,
          icon: category.icon || 'fas fa-tag',
          relevanceScore: this.calculateRelevanceScore(category.name, query),
          metadata: {
            color: category.color,
            parentId: category.parentId,
            isActive: category.isActive
          }
        }));
      })
    );
  }

  private getCommonSuggestions(query: string): SearchSuggestion[] {
    const commonTerms = [
      { text: 'income', type: 'suggestion', icon: 'fas fa-arrow-up' },
      { text: 'expense', type: 'suggestion', icon: 'fas fa-arrow-down' },
      { text: 'transfer', type: 'suggestion', icon: 'fas fa-exchange-alt' },
      { text: 'budget', type: 'suggestion', icon: 'fas fa-piggy-bank' },
      { text: 'category', type: 'suggestion', icon: 'fas fa-tag' },
      { text: 'report', type: 'suggestion', icon: 'fas fa-chart-bar' },
      { text: 'pending', type: 'suggestion', icon: 'fas fa-clock' },
      { text: 'completed', type: 'suggestion', icon: 'fas fa-check-circle' }
    ];

    return commonTerms
      .filter(term => term.text.toLowerCase().includes(query.toLowerCase()))
      .map(term => ({
        id: `common-${term.text}`,
        text: term.text,
        type: term.type as any,
        icon: term.icon
      }));
  }

  private getCategorySuggestions(query: string): SearchSuggestion[] {
    // This would typically come from a service call
    const categories = [
      'Food & Dining',
      'Transportation',
      'Entertainment',
      'Shopping',
      'Bills & Utilities',
      'Healthcare',
      'Travel',
      'Education'
    ];

    return categories
      .filter(category => category.toLowerCase().includes(query.toLowerCase()))
      .map(category => ({
        id: `category-${category}`,
        text: category,
        type: 'category' as const,
        icon: 'fas fa-tag'
      }));
  }

  private calculateRelevanceScore(text: string, query: string): number {
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    // Exact match gets highest score
    if (textLower === queryLower) return 100;
    
    // Starts with query gets high score
    if (textLower.startsWith(queryLower)) return 90;
    
    // Contains query gets medium score
    if (textLower.includes(queryLower)) return 70;
    
    // Word boundary match gets lower score
    const words = textLower.split(/\s+/);
    const queryWords = queryLower.split(/\s+/);
    const matchingWords = queryWords.filter(qw => 
      words.some(w => w.includes(qw))
    ).length;
    
    return (matchingWords / queryWords.length) * 50;
  }

  private sortResultsByRelevance(results: SearchResult[], query: string): SearchResult[] {
    return results.sort((a, b) => {
      // First sort by relevance score
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      
      // Then sort by type priority
      const typePriority = { transaction: 3, budget: 2, category: 1, report: 0 };
      const aPriority = typePriority[a.type] || 0;
      const bPriority = typePriority[b.type] || 0;
      
      if (bPriority !== aPriority) {
        return bPriority - aPriority;
      }
      
      // Finally sort alphabetically
      return a.title.localeCompare(b.title);
    });
  }

  private generateSearchSummary(): string {
    const results = this._searchResults();
    if (results.length === 0) return 'No results found';

    const typeCounts = results.reduce((acc, result) => {
      acc[result.type] = (acc[result.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const summaryParts = Object.entries(typeCounts).map(([type, count]) => 
      `${count} ${type}${count !== 1 ? 's' : ''}`
    );

    return `Found ${results.length} result${results.length !== 1 ? 's' : ''}: ${summaryParts.join(', ')}`;
  }

  private getTransactionIcon(type: string): string {
    switch (type) {
      case 'income': return 'fas fa-arrow-up';
      case 'expense': return 'fas fa-arrow-down';
      case 'transfer': return 'fas fa-exchange-alt';
      case 'adjustment': return 'fas fa-balance-scale';
      default: return 'fas fa-receipt';
    }
  }

  private addToSearchHistory(query: string): void {
    if (!query.trim()) return;

    this._searchHistory.update(history => {
      const filtered = history.filter(h => h !== query);
      return [query, ...filtered].slice(0, 50); // Keep last 50 searches
    });
    this.saveSearchHistory();
  }

  private isCacheValid(key: string): boolean {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp) return false;
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  private loadSearchHistory(): void {
    const history = this.storageService.getItem('global-search-history');
    if (history) {
      try {
        this._searchHistory.set(JSON.parse(history));
      } catch (error) {
        console.error('Failed to load search history:', error);
      }
    }
  }

  private saveSearchHistory(): void {
    this.storageService.setItem('global-search-history', JSON.stringify(this._searchHistory()));
  }

  private loadRecentSearches(): void {
    const recent = this.storageService.getItem('global-search-recent');
    if (recent) {
      try {
        this._recentSearches.set(JSON.parse(recent));
      } catch (error) {
        console.error('Failed to load recent searches:', error);
      }
    }
  }

  private saveRecentSearches(): void {
    this.storageService.setItem('global-search-recent', JSON.stringify(this._recentSearches()));
  }
}
