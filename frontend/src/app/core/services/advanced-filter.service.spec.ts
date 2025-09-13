import { TestBed } from '@angular/core/testing';
import { AdvancedFilterService, FilterCondition, FilterGroup, SavedFilter, FilterPreset, SearchSuggestion } from './advanced-filter.service';
import { StorageService } from './storage.service';

describe('AdvancedFilterService', () => {
  let service: AdvancedFilterService;
  let storageService: jasmine.SpyObj<StorageService>;

  const mockFilterCondition: FilterCondition = {
    field: 'title',
    operator: 'contains',
    value: 'test'
  };

  const mockFilterGroup: FilterGroup = {
    id: 'group1',
    name: 'Test Group',
    logic: 'AND',
    conditions: [mockFilterCondition],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockSavedFilter: SavedFilter = {
    id: 'saved1',
    name: 'Test Filter',
    description: 'Test Description',
    filterGroups: [mockFilterGroup],
    isGlobal: false,
    isDefault: false,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockPreset: FilterPreset = {
    id: 'preset1',
    name: 'Recent Transactions',
    description: 'Show recent transactions',
    category: 'transactions',
    filterGroups: [mockFilterGroup],
    icon: 'fas fa-clock',
    color: '#007bff'
  };

  const mockSearchSuggestion: SearchSuggestion = {
    id: 'suggestion1',
    text: 'test search',
    type: 'suggestion',
    category: 'transactions',
    count: 5
  };

  beforeEach(() => {
    const storageServiceSpy = jasmine.createSpyObj('StorageService', [
      'getItem', 'setItem', 'removeItem'
    ]);

    TestBed.configureTestingModule({
      providers: [
        AdvancedFilterService,
        { provide: StorageService, useValue: storageServiceSpy }
      ]
    });

    service = TestBed.inject(AdvancedFilterService);
    storageService = TestBed.inject(StorageService) as jasmine.SpyObj<StorageService>;

    // Setup default storage responses
    storageService.getItem.and.returnValue(null);
    
    // Reset service state before each test
    service.resetToDefaults();
    
    // Clear any spy calls from previous tests
    storageService.getItem.calls.reset();
    storageService.setItem.calls.reset();
    storageService.removeItem.calls.reset();
  });

  afterEach(() => {
    // Ensure service is reset after each test
    service.resetToDefaults();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Filter Management', () => {
    beforeEach(() => {
      // Reset service state before each test
      service.resetToDefaults();
    });

    it('should initialize with empty filters', () => {
      expect(service.activeFilters()).toEqual([]);
      expect(service.savedFilters()).toEqual([]);
      expect(service.searchHistory()).toEqual([]);
    });

    it('should add filter group', () => {
      const newGroup = {
        name: 'New Group',
        logic: 'AND' as const,
        conditions: [],
        isActive: true
      };

      const id = service.addFilterGroup(newGroup);
      expect(id).toBeDefined();
      expect(service.activeFilters().length).toBe(1);
    });

    it('should remove filter group', () => {
      const newGroup = {
        name: 'New Group',
        logic: 'AND' as const,
        conditions: [],
        isActive: true
      };

      const id = service.addFilterGroup(newGroup);
      const result = service.removeFilterGroup(id);
      expect(result).toBe(true);
      expect(service.activeFilters().length).toBe(0);
    });

    it('should clear all filters', () => {
      const newGroup = {
        name: 'New Group',
        logic: 'AND' as const,
        conditions: [],
        isActive: true
      };

      service.addFilterGroup(newGroup);
      service.clearAllFilters();
      expect(service.activeFilters()).toEqual([]);
    });
  });

  describe('Saved Filters', () => {
    beforeEach(() => {
      // Reset service state before each test
      service.resetToDefaults();
    });

    it('should save current filters', () => {
      const newGroup = {
        name: 'New Group',
        logic: 'AND' as const,
        conditions: [],
        isActive: true
      };

      service.addFilterGroup(newGroup);
      const id = service.saveCurrentFilters('Test Filter', 'Test Description', false);
      
      expect(id).toBeDefined();
      expect(service.savedFilters().length).toBe(1);
      expect(service.savedFilters()[0].name).toBe('Test Filter');
    });

    it('should load saved filter', () => {
      const newGroup = {
        name: 'New Group',
        logic: 'AND' as const,
        conditions: [],
        isActive: true
      };

      service.addFilterGroup(newGroup);
      const savedId = service.saveCurrentFilters('Test Filter', 'Test Description', false);
      
      const result = service.loadSavedFilter(savedId);
      expect(result).toBe(true);
    });

    it('should delete saved filter', () => {
      const newGroup = {
        name: 'New Group',
        logic: 'AND' as const,
        conditions: [],
        isActive: true
      };

      service.addFilterGroup(newGroup);
      const savedId = service.saveCurrentFilters('Test Filter', 'Test Description', false);
      
      const result = service.deleteSavedFilter(savedId);
      expect(result).toBe(true);
      expect(service.savedFilters().length).toBe(0);
    });
  });

  describe('Search History', () => {
    it('should add to search history', () => {
      service.addToSearchHistory('test query');
      expect(service.searchHistory()).toContain('test query');
    });

    it('should not add duplicate queries', () => {
      service.addToSearchHistory('test query');
      service.addToSearchHistory('test query');
      expect(service.searchHistory().filter(q => q === 'test query').length).toBe(1);
    });

    it('should limit search history size', () => {
      // Add more than the limit (50)
      for (let i = 0; i < 55; i++) {
        service.addToSearchHistory(`query ${i}`);
      }
      expect(service.searchHistory().length).toBe(50);
    });
  });

  describe('Presets', () => {
    it('should get available presets for category', () => {
      const presets = service.getFilterPresets('transactions');
      expect(Array.isArray(presets)).toBe(true);
      expect(presets.length).toBeGreaterThan(0);
    });

    it('should apply preset', () => {
      const presets = service.getFilterPresets('transactions');
      if (presets.length > 0) {
        const result = service.applyFilterPreset(presets[0].id);
        expect(result).toBe(true);
      }
    });
  });

  describe('Query Building', () => {
    it('should build query from active filters', () => {
      const newGroup = {
        name: 'New Group',
        logic: 'AND' as const,
        conditions: [mockFilterCondition],
        isActive: true
      };

      service.addFilterGroup(newGroup);
      const query = service.buildQuery();
      expect(query).toBeDefined();
    });

    it('should handle empty filters', () => {
      const query = service.buildQuery();
      expect(query).toEqual({});
    });
  });

  describe('Export/Import', () => {
    it('should export filters to JSON', () => {
      const newGroup = {
        name: 'New Group',
        logic: 'AND' as const,
        conditions: [],
        isActive: true
      };

      service.addFilterGroup(newGroup);
      const exported = service.exportFilters();
      const parsed = JSON.parse(exported);
      expect(parsed.activeFilters).toBeDefined();
      expect(parsed.savedFilters).toBeDefined();
    });

    it('should import filters from JSON', () => {
      const filterData = {
        activeFilters: [mockFilterGroup],
        savedFilters: [mockSavedFilter],
        searchHistory: ['test query']
      };
      
      const success = service.importFilters(JSON.stringify(filterData));
      expect(success).toBe(true);
    });

    it('should handle invalid JSON import', () => {
      const success = service.importFilters('invalid json');
      expect(success).toBe(false);
    });

    it('should export filters to file', () => {
      spyOn(URL, 'createObjectURL').and.returnValue('blob:url');
      spyOn(URL, 'revokeObjectURL');
      spyOn(document, 'createElement').and.returnValue({
        href: '',
        download: '',
        click: jasmine.createSpy('click')
      } as any);
      spyOn(document.body, 'appendChild');
      spyOn(document.body, 'removeChild');

      service.exportFiltersToFile('test-filters.json');
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('should import filters from file', (done) => {
      const mockFile = new File(['{"activeFilters": []}'], 'test.json', { type: 'application/json' });
      
      service.importFiltersFromFile(mockFile).then(success => {
        expect(success).toBe(true);
        done();
      });
    });
  });

  describe('Statistics and Analytics', () => {
    it('should get filter statistics', () => {
      const newGroup = {
        name: 'New Group',
        logic: 'AND' as const,
        conditions: [],
        isActive: true
      };

      service.addFilterGroup(newGroup);
      service.saveCurrentFilters('Test Filter', 'Test Description', false);
      service.addToSearchHistory('test query');

      const stats = service.getFilterStatistics();
      expect(stats.activeFilters).toBe(1);
      expect(stats.savedFilters).toBe(1);
      expect(stats.searchHistory).toBe(1);
    });
  });

  describe('Reset and Cleanup', () => {
    it('should reset to defaults', () => {
      const newGroup = {
        name: 'New Group',
        logic: 'AND' as const,
        conditions: [],
        isActive: true
      };

      service.addFilterGroup(newGroup);
      service.saveCurrentFilters('Test Filter', 'Test Description', false);
      service.addToSearchHistory('test query');

      service.resetToDefaults();
      expect(service.activeFilters()).toEqual([]);
      expect(service.savedFilters()).toEqual([]);
      expect(service.searchHistory()).toEqual([]);
    });
  });

  describe('Search Suggestions', () => {
    it('should generate search suggestions', (done) => {
      service.addToSearchHistory('test query');
      
      service.searchWithSuggestions('test').subscribe(suggestions => {
        expect(Array.isArray(suggestions)).toBe(true);
        done();
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty search queries', () => {
      expect(() => service.addToSearchHistory('')).not.toThrow();
      expect(() => service.addToSearchHistory('   ')).not.toThrow();
    });

    it('should handle non-existent filter group removal', () => {
      const result = service.removeFilterGroup('non-existent');
      expect(result).toBe(false);
    });

    it('should handle non-existent saved filter operations', () => {
      expect(() => service.deleteSavedFilter('non-existent')).not.toThrow();
      expect(() => service.loadSavedFilter('non-existent')).not.toThrow();
    });

    it('should handle invalid JSON import', () => {
      const result = service.importFilters('invalid json');
      expect(result).toBe(false);
    });

    it('should handle null/undefined values in search history', () => {
      expect(() => service.addToSearchHistory(null as any)).not.toThrow();
      expect(() => service.addToSearchHistory(undefined as any)).not.toThrow();
    });

    it('should handle empty filter group conditions', () => {
      const emptyGroup = {
        name: 'Empty Group',
        logic: 'AND' as const,
        conditions: [],
        isActive: true
      };
      const id = service.addFilterGroup(emptyGroup);
      expect(id).toBeDefined();
    });

    it('should handle filter group with single condition', () => {
      const singleConditionGroup = {
        name: 'Single Condition Group',
        logic: 'AND' as const,
        conditions: [mockFilterCondition],
        isActive: true
      };
      const id = service.addFilterGroup(singleConditionGroup);
      expect(id).toBeDefined();
    });
  });

  describe('Filter Query Building', () => {
    it('should build query with AND logic', () => {
      const andGroup = {
        name: 'AND Group',
        logic: 'AND' as const,
        conditions: [mockFilterCondition],
        isActive: true
      };
      service.addFilterGroup(andGroup);
      const query = service.buildQuery();
      expect(query).toBeDefined();
    });

    it('should build query with OR logic', () => {
      const orGroup = {
        name: 'OR Group',
        logic: 'OR' as const,
        conditions: [mockFilterCondition],
        isActive: true
      };
      service.addFilterGroup(orGroup);
      const query = service.buildQuery();
      expect(query).toBeDefined();
    });

    it('should build query with mixed logic', () => {
      const andGroup = {
        name: 'AND Group',
        logic: 'AND' as const,
        conditions: [mockFilterCondition],
        isActive: true
      };
      const orGroup = {
        name: 'OR Group',
        logic: 'OR' as const,
        conditions: [mockFilterCondition],
        isActive: true
      };
      service.addFilterGroup(andGroup);
      service.addFilterGroup(orGroup);
      const query = service.buildQuery();
      expect(query).toBeDefined();
    });

    it('should handle empty filter groups in query building', () => {
      const emptyGroup = {
        name: 'Empty Group',
        logic: 'AND' as const,
        conditions: [],
        isActive: true
      };
      service.addFilterGroup(emptyGroup);
      const query = service.buildQuery();
      expect(query).toBeDefined();
    });
  });

  describe('Search Suggestions', () => {
    it('should generate suggestions for transactions category', (done) => {
      service.searchWithSuggestions('test', 'transactions').subscribe(suggestions => {
        expect(Array.isArray(suggestions)).toBe(true);
        expect(suggestions.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should generate suggestions for other categories', (done) => {
      service.searchWithSuggestions('test', 'budgets').subscribe(suggestions => {
        expect(Array.isArray(suggestions)).toBe(true);
        done();
      });
    });

    it('should generate suggestions without category', (done) => {
      service.searchWithSuggestions('test').subscribe(suggestions => {
        expect(Array.isArray(suggestions)).toBe(true);
        done();
      });
    });

    it('should include recent searches in suggestions', (done) => {
      service.addToSearchHistory('recent search');
      service.searchWithSuggestions('recent').subscribe(suggestions => {
        const recentSuggestions = suggestions.filter(s => s.type === 'recent');
        expect(recentSuggestions.length).toBeGreaterThan(0);
        done();
      });
    });
  });

  describe('Filter Statistics', () => {
    it('should get correct statistics', () => {
      const newGroup = {
        name: 'New Group',
        logic: 'AND' as const,
        conditions: [],
        isActive: true
      };

      service.addFilterGroup(newGroup);
      service.saveCurrentFilters('Test Filter', 'Test Description', false);
      service.addToSearchHistory('test query');

      const stats = service.getFilterStatistics();
      expect(stats.activeFilters).toBe(1);
      expect(stats.savedFilters).toBe(1);
      expect(stats.searchHistory).toBe(1);
      expect(stats.mostUsedFilter).not.toBeNull();
      expect(stats.mostUsedFilter.name).toBe('Test Filter');
      expect(Array.isArray(stats.recentActivity)).toBe(true);
    });

    it('should get most used filter when available', () => {
      const newGroup = {
        name: 'New Group',
        logic: 'AND' as const,
        conditions: [],
        isActive: true
      };

      service.addFilterGroup(newGroup);
      const savedId = service.saveCurrentFilters('Test Filter', 'Test Description', false);
      service.loadSavedFilter(savedId);
      service.loadSavedFilter(savedId);

      const stats = service.getFilterStatistics();
      expect(stats.mostUsedFilter).toBeDefined();
      expect(stats.mostUsedFilter?.usageCount).toBe(2);
    });

    it('should get recent activity', () => {
      const newGroup = {
        name: 'New Group',
        logic: 'AND' as const,
        conditions: [],
        isActive: true
      };

      service.addFilterGroup(newGroup);
      const savedId = service.saveCurrentFilters('Test Filter', 'Test Description', false);
      service.loadSavedFilter(savedId);

      const stats = service.getFilterStatistics();
      expect(Array.isArray(stats.recentActivity)).toBe(true);
      expect(stats.recentActivity.length).toBeGreaterThan(0);
    });
  });

  describe('File Operations', () => {
    it('should export filters to file with custom filename', () => {
      spyOn(URL, 'createObjectURL').and.returnValue('blob:url');
      spyOn(URL, 'revokeObjectURL');
      spyOn(document, 'createElement').and.returnValue({
        href: '',
        download: '',
        click: jasmine.createSpy('click')
      } as any);
      spyOn(document.body, 'appendChild');
      spyOn(document.body, 'removeChild');

      service.exportFiltersToFile('custom-filters.json');
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('should export filters to file with default filename', () => {
      spyOn(URL, 'createObjectURL').and.returnValue('blob:url');
      spyOn(URL, 'revokeObjectURL');
      spyOn(document, 'createElement').and.returnValue({
        href: '',
        download: '',
        click: jasmine.createSpy('click')
      } as any);
      spyOn(document.body, 'appendChild');
      spyOn(document.body, 'removeChild');

      service.exportFiltersToFile();
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('should handle file import error', (done) => {
      const mockFile = new File(['invalid json'], 'test.json', { type: 'application/json' });
      
      service.importFiltersFromFile(mockFile).then(success => {
        expect(success).toBe(false);
        done();
      });
    });
  });

  describe('Filter Group Updates', () => {
    it('should update existing filter group', () => {
      const newGroup = {
        name: 'New Group',
        logic: 'AND' as const,
        conditions: [],
        isActive: true
      };

      const id = service.addFilterGroup(newGroup);
      const result = service.updateFilterGroup(id, { name: 'Updated Group' });
      expect(result).toBe(true);
    });

    it('should not update non-existent filter group', () => {
      const result = service.updateFilterGroup('non-existent', { name: 'Updated Group' });
      expect(result).toBe(false);
    });

    it('should update filter group with multiple fields', () => {
      const newGroup = {
        name: 'New Group',
        logic: 'AND' as const,
        conditions: [],
        isActive: true
      };

      const id = service.addFilterGroup(newGroup);
      const result = service.updateFilterGroup(id, { 
        name: 'Updated Group', 
        logic: 'OR' as const,
        isActive: false
      });
      expect(result).toBe(true);
    });
  });

  describe('Filter Presets', () => {
    it('should get all presets when no category specified', () => {
      const presets = service.getFilterPresets();
      expect(Array.isArray(presets)).toBe(true);
      expect(presets.length).toBeGreaterThan(0);
    });

    it('should get presets for specific category', () => {
      const transactionPresets = service.getFilterPresets('transactions');
      const budgetPresets = service.getFilterPresets('budgets');
      
      expect(Array.isArray(transactionPresets)).toBe(true);
      expect(Array.isArray(budgetPresets)).toBe(true);
      expect(transactionPresets.length).toBeGreaterThan(0);
    });

    it('should apply valid preset', () => {
      const presets = service.getFilterPresets('transactions');
      if (presets.length > 0) {
        const result = service.applyFilterPreset(presets[0].id);
        expect(result).toBe(true);
      }
    });

    it('should not apply invalid preset', () => {
      const result = service.applyFilterPreset('invalid-preset');
      expect(result).toBe(false);
    });
  });

  describe('Search History Management', () => {
    it('should limit search history to 50 items', () => {
      for (let i = 0; i < 55; i++) {
        service.addToSearchHistory(`query ${i}`);
      }
      expect(service.searchHistory().length).toBe(50);
    });

    it('should not add duplicate queries', () => {
      service.addToSearchHistory('test query');
      service.addToSearchHistory('test query');
      expect(service.searchHistory().filter(q => q === 'test query').length).toBe(1);
    });

    it('should move duplicate query to front', () => {
      service.addToSearchHistory('first query');
      service.addToSearchHistory('second query');
      service.addToSearchHistory('first query');
      
      const history = service.searchHistory();
      expect(history[0]).toBe('first query');
    });
  });

  describe('Storage Operations', () => {
    it('should handle storage errors gracefully', () => {
      storageService.getItem.and.throwError('Storage error');
      expect(() => service.resetToDefaults()).not.toThrow();
    });

    it('should handle invalid stored data', () => {
      storageService.getItem.and.returnValue('invalid json');
      expect(() => service.resetToDefaults()).not.toThrow();
    });
  });

  describe('Filter Group Logic', () => {
    it('should handle filter groups with different logic types', () => {
      const andGroup = {
        name: 'AND Group',
        logic: 'AND' as const,
        conditions: [mockFilterCondition],
        isActive: true
      };
      const orGroup = {
        name: 'OR Group',
        logic: 'OR' as const,
        conditions: [mockFilterCondition],
        isActive: true
      };

      service.addFilterGroup(andGroup);
      service.addFilterGroup(orGroup);
      
      const activeFilters = service.activeFilters();
      expect(activeFilters.length).toBe(2);
      expect(activeFilters[0].logic).toBe('AND');
      expect(activeFilters[1].logic).toBe('OR');
    });
  });

  describe('Advanced Branch Coverage', () => {
    it('should handle different operator types in conditions', () => {
      const condition1 = { field: 'amount', operator: 'equals' as const, value: '100', value2: undefined };
      const condition2 = { field: 'amount', operator: 'not_equals' as const, value: '200', value2: undefined };
      const condition3 = { field: 'amount', operator: 'gt' as const, value: '50', value2: undefined };
      const condition4 = { field: 'amount', operator: 'lt' as const, value: '500', value2: undefined };
      const condition5 = { field: 'amount', operator: 'between' as const, value: '100', value2: '200' };
      const condition6 = { field: 'amount', operator: 'contains' as const, value: 'test', value2: undefined };
      const condition7 = { field: 'amount', operator: 'starts_with' as const, value: 'prefix', value2: undefined };
      const condition8 = { field: 'amount', operator: 'ends_with' as const, value: 'suffix', value2: undefined };
      const condition9 = { field: 'amount', operator: 'is_null' as const, value: '', value2: undefined };
      const condition10 = { field: 'amount', operator: 'is_not_null' as const, value: '', value2: undefined };

      const group = {
        name: 'Test Group',
        logic: 'AND' as const,
        conditions: [condition1, condition2, condition3, condition4, condition5, condition6, condition7, condition8, condition9, condition10],
        isActive: true
      };

      service.addFilterGroup(group);
      const query = service.buildQuery();
      expect(query).toBeDefined();
    });

    it('should handle different field types', () => {
      const textCondition = { field: 'description', operator: 'contains' as const, value: 'test', value2: undefined };
      const numberCondition = { field: 'amount', operator: 'gt' as const, value: '100', value2: undefined };
      const dateCondition = { field: 'date', operator: 'between' as const, value: '2024-01-01', value2: '2024-12-31' };
      const booleanCondition = { field: 'isActive', operator: 'equals' as const, value: 'true', value2: undefined };

      const group = {
        name: 'Mixed Types Group',
        logic: 'AND' as const,
        conditions: [textCondition, numberCondition, dateCondition, booleanCondition],
        isActive: true
      };

      service.addFilterGroup(group);
      const query = service.buildQuery();
      expect(query).toBeDefined();
    });

    it('should handle edge cases in search suggestions', (done) => {
      let completedTests = 0;
      const totalTests = 3;
      
      const checkCompletion = () => {
        completedTests++;
        if (completedTests === totalTests) {
          done();
        }
      };

      // Test with very long query
      const longQuery = 'a'.repeat(1000);
      service.searchWithSuggestions(longQuery).subscribe(suggestions => {
        expect(Array.isArray(suggestions)).toBe(true);
        checkCompletion();
      });

      // Test with special characters
      const specialQuery = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      service.searchWithSuggestions(specialQuery).subscribe(suggestions => {
        expect(Array.isArray(suggestions)).toBe(true);
        checkCompletion();
      });

      // Test with numbers only
      const numberQuery = '1234567890';
      service.searchWithSuggestions(numberQuery).subscribe(suggestions => {
        expect(Array.isArray(suggestions)).toBe(true);
        checkCompletion();
      });
    });

    it('should handle different condition building scenarios', () => {
      // Test building query with different condition types
      const validCondition = { field: 'amount', operator: 'equals' as const, value: '100', value2: undefined };
      const rangeCondition = { field: 'amount', operator: 'between' as const, value: '100', value2: '200' };
      
      const group = {
        name: 'Test Group',
        logic: 'AND' as const,
        conditions: [validCondition, rangeCondition],
        isActive: true
      };

      service.addFilterGroup(group);
      const query = service.buildQuery();
      expect(query).toBeDefined();
    });

    it('should handle different filter group states', () => {
      // Test active group
      const activeGroup = {
        name: 'Active Group',
        logic: 'AND' as const,
        conditions: [mockFilterCondition],
        isActive: true
      };
      service.addFilterGroup(activeGroup);

      // Test inactive group
      const inactiveGroup = {
        name: 'Inactive Group',
        logic: 'OR' as const,
        conditions: [mockFilterCondition],
        isActive: false
      };
      service.addFilterGroup(inactiveGroup);

      const query = service.buildQuery();
      expect(query).toBeDefined();
    });

    it('should handle different search history scenarios', () => {
      // Test adding same query multiple times
      service.addToSearchHistory('duplicate query');
      service.addToSearchHistory('duplicate query');
      service.addToSearchHistory('duplicate query');
      
      const history = service.searchHistory();
      expect(history.filter(q => q === 'duplicate query').length).toBe(1);
      expect(history[0]).toBe('duplicate query');

      // Test adding different queries
      service.addToSearchHistory('query 1');
      service.addToSearchHistory('query 2');
      service.addToSearchHistory('query 3');
      
      const updatedHistory = service.searchHistory();
      expect(updatedHistory.length).toBeGreaterThan(0);
    });

    it('should handle different export/import scenarios', () => {
      // Test export with no data
      const emptyExport = service.exportFilters();
      expect(emptyExport).toBeDefined();

      // Test import with malformed JSON
      const malformedJson = '{"invalid": json}';
      const result = service.importFilters(malformedJson);
      expect(result).toBe(false);

      // Test import with valid but incomplete data
      const incompleteData = '{"activeFilters": []}';
      const incompleteResult = service.importFilters(incompleteData);
      expect(incompleteResult).toBe(true);
    });

    it('should handle different preset scenarios', () => {
      // Test getting presets for different categories
      const transactionPresets = service.getFilterPresets('transactions');
      const budgetPresets = service.getFilterPresets('budgets');
      const allPresets = service.getFilterPresets();

      expect(Array.isArray(transactionPresets)).toBe(true);
      expect(Array.isArray(budgetPresets)).toBe(true);
      expect(Array.isArray(allPresets)).toBe(true);

      // Test applying non-existent preset
      const invalidPresetResult = service.applyFilterPreset('non-existent-preset');
      expect(invalidPresetResult).toBe(false);
    });

    it('should handle different statistics scenarios', () => {
      // Test statistics with no data
      const emptyStats = service.getFilterStatistics();
      expect(emptyStats.activeFilters).toBe(0);
      expect(emptyStats.savedFilters).toBe(0);
      expect(emptyStats.searchHistory).toBe(0);

      // Test statistics with data
      const group = {
        name: 'Test Group',
        logic: 'AND' as const,
        conditions: [mockFilterCondition],
        isActive: true
      };
      service.addFilterGroup(group);
      service.saveCurrentFilters('Test Filter');
      service.addToSearchHistory('test query');

      const statsWithData = service.getFilterStatistics();
      expect(statsWithData.activeFilters).toBe(1);
      expect(statsWithData.savedFilters).toBe(1);
      expect(statsWithData.searchHistory).toBe(1);
    });

    it('should handle different file operation scenarios', () => {
      // Test file export with custom filename
      spyOn(URL, 'createObjectURL').and.returnValue('blob:url');
      spyOn(URL, 'revokeObjectURL');
      spyOn(document, 'createElement').and.returnValue({
        href: '',
        download: '',
        click: jasmine.createSpy('click')
      } as any);
      spyOn(document.body, 'appendChild');
      spyOn(document.body, 'removeChild');

      service.exportFiltersToFile('custom-filters.json');
      expect(URL.createObjectURL).toHaveBeenCalled();

      // Test file import with different file types
      const jsonFile = new File(['{"activeFilters": []}'], 'test.json', { type: 'application/json' });
      const textFile = new File(['not json'], 'test.txt', { type: 'text/plain' });

      service.importFiltersFromFile(jsonFile).then(result => {
        expect(result).toBe(true);
      });

      service.importFiltersFromFile(textFile).then(result => {
        expect(result).toBe(false);
      });
    });
  });
});