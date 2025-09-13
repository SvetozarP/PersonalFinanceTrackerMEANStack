import { Injectable, signal, computed, inject } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map, debounceTime, distinctUntilChanged } from 'rxjs';
import { StorageService } from './storage.service';

export interface FilterCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'regex' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'in' | 'not_in' | 'is_null' | 'is_not_null';
  value: any;
  value2?: any; // For between operator
}

export interface FilterGroup {
  id: string;
  name: string;
  conditions: FilterCondition[];
  logic: 'AND' | 'OR';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  filterGroups: FilterGroup[];
  isGlobal: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  lastUsed?: Date;
}

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  category: 'transactions' | 'budgets' | 'categories' | 'reports' | 'global';
  filterGroups: FilterGroup[];
  icon: string;
  color: string;
}

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'suggestion' | 'category' | 'tag';
  category?: string;
  count?: number;
  lastUsed?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AdvancedFilterService {
  private storageService = inject(StorageService);
  
  // State management
  private _activeFilters = signal<FilterGroup[]>([]);
  private _savedFilters = signal<SavedFilter[]>([]);
  private _searchHistory = signal<string[]>([]);
  private _recentSearches = signal<SearchSuggestion[]>([]);
  private _isFiltering = signal(false);
  private _filterResults = signal<any[]>([]);
  private _totalResults = signal(0);

  // Public observables
  public activeFilters = this._activeFilters.asReadonly();
  public savedFilters = this._savedFilters.asReadonly();
  public searchHistory = this._searchHistory.asReadonly();
  public recentSearches = this._recentSearches.asReadonly();
  public isFiltering = this._isFiltering.asReadonly();
  public filterResults = this._filterResults.asReadonly();
  public totalResults = this._totalResults.asReadonly();

  // Computed properties
  public hasActiveFilters = computed(() => this._activeFilters().length > 0);
  public activeFilterCount = computed(() => this._activeFilters().length);
  public filterSummary = computed(() => this.generateFilterSummary());

  // Filter presets
  private readonly FILTER_PRESETS: FilterPreset[] = [
    {
      id: 'recent-transactions',
      name: 'Recent Transactions',
      description: 'Show transactions from the last 7 days',
      category: 'transactions',
      icon: 'fas fa-clock',
      color: '#3b82f6',
      filterGroups: [{
        id: 'recent-date',
        name: 'Recent Date Filter',
        conditions: [{
          field: 'date',
          operator: 'gte',
          value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }],
        logic: 'AND',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }]
    },
    {
      id: 'high-amount-transactions',
      name: 'High Amount Transactions',
      description: 'Show transactions over $100',
      category: 'transactions',
      icon: 'fas fa-dollar-sign',
      color: '#ef4444',
      filterGroups: [{
        id: 'high-amount',
        name: 'High Amount Filter',
        conditions: [{
          field: 'amount',
          operator: 'gt',
          value: 100
        }],
        logic: 'AND',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }]
    },
    {
      id: 'over-budget-categories',
      name: 'Over Budget Categories',
      description: 'Show categories that are over budget',
      category: 'budgets',
      icon: 'fas fa-exclamation-triangle',
      color: '#f59e0b',
      filterGroups: [{
        id: 'over-budget',
        name: 'Over Budget Filter',
        conditions: [{
          field: 'isOverBudget',
          operator: 'equals',
          value: true
        }],
        logic: 'AND',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }]
    },
    {
      id: 'expense-transactions',
      name: 'Expense Transactions',
      description: 'Show only expense transactions',
      category: 'transactions',
      icon: 'fas fa-arrow-down',
      color: '#ef4444',
      filterGroups: [{
        id: 'expense-type',
        name: 'Expense Type Filter',
        conditions: [{
          field: 'type',
          operator: 'equals',
          value: 'expense'
        }],
        logic: 'AND',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }]
    },
    {
      id: 'income-transactions',
      name: 'Income Transactions',
      description: 'Show only income transactions',
      category: 'transactions',
      icon: 'fas fa-arrow-up',
      color: '#10b981',
      filterGroups: [{
        id: 'income-type',
        name: 'Income Type Filter',
        conditions: [{
          field: 'type',
          operator: 'equals',
          value: 'income'
        }],
        logic: 'AND',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }]
    }
  ];

  constructor() {
    this.loadSavedFilters();
    this.loadSearchHistory();
  }

  /**
   * Update all active filters
   */
  updateFilters(filterGroups: FilterGroup[]): void {
    this._activeFilters.set(filterGroups);
    this.saveActiveFilters();
  }

  /**
   * Add a new filter group
   */
  addFilterGroup(filterGroup: Omit<FilterGroup, 'id' | 'createdAt' | 'updatedAt'>): string {
    const newFilterGroup: FilterGroup = {
      ...filterGroup,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this._activeFilters.update(filters => [...filters, newFilterGroup]);
    this.saveActiveFilters();
    return newFilterGroup.id;
  }

  /**
   * Update an existing filter group
   */
  updateFilterGroup(id: string, updates: Partial<FilterGroup>): boolean {
    const index = this._activeFilters().findIndex(fg => fg.id === id);
    if (index === -1) return false;

    this._activeFilters.update(filters => 
      filters.map(fg => 
        fg.id === id 
          ? { ...fg, ...updates, updatedAt: new Date() }
          : fg
      )
    );
    this.saveActiveFilters();
    return true;
  }

  /**
   * Remove a filter group
   */
  removeFilterGroup(id: string): boolean {
    const index = this._activeFilters().findIndex(fg => fg.id === id);
    if (index === -1) return false;

    this._activeFilters.update(filters => filters.filter(fg => fg.id !== id));
    this.saveActiveFilters();
    return true;
  }

  /**
   * Clear all active filters
   */
  clearAllFilters(): void {
    this._activeFilters.set([]);
    this.saveActiveFilters();
  }

  /**
   * Apply a filter preset
   */
  applyFilterPreset(presetId: string): boolean {
    const preset = this.FILTER_PRESETS.find(p => p.id === presetId);
    if (!preset) return false;

    // Clear existing filters and apply preset
    this._activeFilters.set(preset.filterGroups.map(fg => ({
      ...fg,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    })));
    this.saveActiveFilters();
    return true;
  }

  /**
   * Save current filters as a named filter
   */
  saveCurrentFilters(name: string, description?: string, isGlobal: boolean = false): string {
    const savedFilter: SavedFilter = {
      id: this.generateId(),
      name,
      description,
      filterGroups: this._activeFilters().map(fg => ({ ...fg })),
      isGlobal,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    };

    this._savedFilters.update(filters => [...filters, savedFilter]);
    this.saveSavedFilters();
    return savedFilter.id;
  }

  /**
   * Load a saved filter
   */
  loadSavedFilter(savedFilterId: string): boolean {
    const savedFilter = this._savedFilters().find(sf => sf.id === savedFilterId);
    if (!savedFilter) return false;

    // Update usage count and last used
    this._savedFilters.update(filters => 
      filters.map(sf => 
        sf.id === savedFilterId 
          ? { 
              ...sf, 
              usageCount: sf.usageCount + 1, 
              lastUsed: new Date(),
              updatedAt: new Date()
            }
          : sf
      )
    );

    // Apply the filter
    this._activeFilters.set(savedFilter.filterGroups.map(fg => ({
      ...fg,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    })));
    this.saveActiveFilters();
    this.saveSavedFilters();
    return true;
  }

  /**
   * Delete a saved filter
   */
  deleteSavedFilter(savedFilterId: string): boolean {
    const index = this._savedFilters().findIndex(sf => sf.id === savedFilterId);
    if (index === -1) return false;

    this._savedFilters.update(filters => filters.filter(sf => sf.id !== savedFilterId));
    this.saveSavedFilters();
    return true;
  }

  /**
   * Get filter presets by category
   */
  getFilterPresets(category?: string): FilterPreset[] {
    if (category) {
      return this.FILTER_PRESETS.filter(preset => preset.category === category);
    }
    return this.FILTER_PRESETS;
  }

  /**
   * Search with suggestions
   */
  searchWithSuggestions(query: string, category?: string): Observable<SearchSuggestion[]> {
    return new Observable(observer => {
      const suggestions: SearchSuggestion[] = [];
      
      // Add recent searches
      const recentSearches = this._searchHistory()
        .filter(search => search.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5)
        .map(search => ({
          id: `recent-${search}`,
          text: search,
          type: 'recent' as const,
          lastUsed: new Date()
        }));

      suggestions.push(...recentSearches);

      // Add category suggestions
      if (category === 'transactions') {
        suggestions.push(
          { id: 'suggestion-income', text: 'income', type: 'suggestion', category: 'transactions' },
          { id: 'suggestion-expense', text: 'expense', type: 'suggestion', category: 'transactions' },
          { id: 'suggestion-transfer', text: 'transfer', type: 'suggestion', category: 'transactions' },
          { id: 'suggestion-pending', text: 'pending', type: 'suggestion', category: 'transactions' },
          { id: 'suggestion-completed', text: 'completed', type: 'suggestion', category: 'transactions' }
        );
      }

      observer.next(suggestions);
      observer.complete();
    });
  }

  /**
   * Add search to history
   */
  addToSearchHistory(query: string): void {
    if (!query || !query.trim()) return;

    this._searchHistory.update(history => {
      const filtered = history.filter(h => h !== query);
      return [query, ...filtered].slice(0, 50); // Keep last 50 searches
    });
    this.saveSearchHistory();
  }

  /**
   * Build query object from active filters
   */
  buildQuery(): any {
    const query: any = {};
    const activeFilters = this._activeFilters();

    if (activeFilters.length === 0) return query;

    // Group filters by logic
    const andFilters = activeFilters.filter(fg => fg.logic === 'AND');
    const orFilters = activeFilters.filter(fg => fg.logic === 'OR');

    // Build AND conditions
    if (andFilters.length > 0) {
      query.$and = andFilters.map(fg => this.buildFilterGroupQuery(fg));
    }

    // Build OR conditions
    if (orFilters.length > 0) {
      query.$or = orFilters.map(fg => this.buildFilterGroupQuery(fg));
    }

    return query;
  }

  /**
   * Build query for a single filter group
   */
  private buildFilterGroupQuery(filterGroup: FilterGroup): any {
    if (filterGroup.conditions.length === 0) return {};

    if (filterGroup.conditions.length === 1) {
      return this.buildConditionQuery(filterGroup.conditions[0]);
    }

    // Multiple conditions in a group
    return {
      $and: filterGroup.conditions.map(condition => this.buildConditionQuery(condition))
    };
  }

  /**
   * Build query for a single condition
   */
  private buildConditionQuery(condition: FilterCondition): any {
    const { field, operator, value, value2 } = condition;

    switch (operator) {
      case 'equals':
        return { [field]: value };
      
      case 'not_equals':
        return { [field]: { $ne: value } };
      
      case 'contains':
        return { [field]: { $regex: value, $options: 'i' } };
      
      case 'not_contains':
        return { [field]: { $not: { $regex: value, $options: 'i' } } };
      
      case 'starts_with':
        return { [field]: { $regex: `^${value}`, $options: 'i' } };
      
      case 'ends_with':
        return { [field]: { $regex: `${value}$`, $options: 'i' } };
      
      case 'regex':
        return { [field]: { $regex: value, $options: 'i' } };
      
      case 'gt':
        return { [field]: { $gt: value } };
      
      case 'gte':
        return { [field]: { $gte: value } };
      
      case 'lt':
        return { [field]: { $lt: value } };
      
      case 'lte':
        return { [field]: { $lte: value } };
      
      case 'between':
        return { [field]: { $gte: value, $lte: value2 } };
      
      case 'in':
        return { [field]: { $in: Array.isArray(value) ? value : [value] } };
      
      case 'not_in':
        return { [field]: { $nin: Array.isArray(value) ? value : [value] } };
      
      case 'is_null':
        return { [field]: { $exists: false } };
      
      case 'is_not_null':
        return { [field]: { $exists: true } };
      
      default:
        return {};
    }
  }

  /**
   * Generate filter summary for display
   */
  private generateFilterSummary(): string {
    const activeFilters = this._activeFilters();
    if (activeFilters.length === 0) return 'No filters applied';

    const summary = activeFilters.map(fg => {
      const conditionCount = fg.conditions.length;
      return `${fg.name} (${conditionCount} condition${conditionCount !== 1 ? 's' : ''})`;
    }).join(', ');

    return `Applied: ${summary}`;
  }

  /**
   * Export filters configuration
   */
  exportFilters(): string {
    const config = {
      activeFilters: this._activeFilters(),
      savedFilters: this._savedFilters(),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(config, null, 2);
  }

  /**
   * Import filters configuration
   */
  importFilters(configJson: string): boolean {
    try {
      const config = JSON.parse(configJson);
      
      if (config.activeFilters) {
        this._activeFilters.set(config.activeFilters);
      }
      
      if (config.savedFilters) {
        this._savedFilters.set(config.savedFilters);
      }
      
      this.saveActiveFilters();
      this.saveSavedFilters();
      return true;
    } catch (error) {
      console.error('Failed to import filters:', error);
      return false;
    }
  }

  /**
   * Export filters to file
   */
  exportFiltersToFile(filename?: string): void {
    const config = this.exportFilters();
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `filters-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Import filters from file
   */
  importFiltersFromFile(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const success = this.importFilters(content);
        resolve(success);
      };
      reader.onerror = () => resolve(false);
      reader.readAsText(file);
    });
  }

  /**
   * Reset all filters to default state
   */
  resetToDefaults(): void {
    this._activeFilters.set([]);
    this._savedFilters.set([]);
    this._searchHistory.set([]);
    this.saveActiveFilters();
    this.saveSavedFilters();
    this.saveSearchHistory();
  }

  /**
   * Get filter statistics
   */
  getFilterStatistics(): any {
    return {
      activeFilters: this._activeFilters().length,
      savedFilters: this._savedFilters().length,
      searchHistory: this._searchHistory().length,
      mostUsedFilter: this.getMostUsedFilter(),
      recentActivity: this.getRecentActivity()
    };
  }

  /**
   * Get most used filter
   */
  private getMostUsedFilter(): SavedFilter | null {
    const savedFilters = this._savedFilters();
    if (savedFilters.length === 0) return null;
    
    return savedFilters.reduce((most, current) => 
      current.usageCount > most.usageCount ? current : most
    );
  }

  /**
   * Get recent activity
   */
  private getRecentActivity(): any[] {
    const savedFilters = this._savedFilters();
    return savedFilters
      .filter(sf => sf.lastUsed)
      .sort((a, b) => new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime())
      .slice(0, 5)
      .map(sf => ({
        name: sf.name,
        lastUsed: sf.lastUsed,
        usageCount: sf.usageCount
      }));
  }

  // Private helper methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private loadSavedFilters(): void {
    const saved = this.storageService.getItem('advanced-filters-saved');
    if (saved) {
      try {
        this._savedFilters.set(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load saved filters:', error);
      }
    }
  }

  private saveSavedFilters(): void {
    this.storageService.setItem('advanced-filters-saved', JSON.stringify(this._savedFilters()));
  }

  private loadSearchHistory(): void {
    const history = this.storageService.getItem('advanced-filters-search-history');
    if (history) {
      try {
        this._searchHistory.set(JSON.parse(history));
      } catch (error) {
        console.error('Failed to load search history:', error);
      }
    }
  }

  private saveSearchHistory(): void {
    this.storageService.setItem('advanced-filters-search-history', JSON.stringify(this._searchHistory()));
  }

  private saveActiveFilters(): void {
    this.storageService.setItem('advanced-filters-active', JSON.stringify(this._activeFilters()));
  }
}
