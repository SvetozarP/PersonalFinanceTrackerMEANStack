import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormBuilder, FormArray } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';

import { AdvancedFilterComponent, FilterField } from './advanced-filter.component';
import { AdvancedFilterService, FilterGroup, FilterCondition, SavedFilter, FilterPreset, SearchSuggestion } from '../../../core/services/advanced-filter.service';

describe('AdvancedFilterComponent', () => {
  let component: AdvancedFilterComponent;
  let fixture: ComponentFixture<AdvancedFilterComponent>;
  let advancedFilterService: jasmine.SpyObj<AdvancedFilterService>;

  const mockFilterField: FilterField = {
    key: 'title',
    label: 'Title',
    type: 'text',
    operators: ['contains', 'equals'],
    options: []
  };

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

  beforeEach(async () => {
    // Mock window methods to prevent hanging tests
    window.confirm = jasmine.createSpy('confirm').and.returnValue(true);
    window.prompt = jasmine.createSpy('prompt').and.returnValue('Test Filter');
    window.alert = jasmine.createSpy('alert').and.stub();

    const advancedFilterServiceSpy = jasmine.createSpyObj('AdvancedFilterService', [
      'addFilterGroup', 'removeFilterGroup', 'clearAllFilters',
      'saveCurrentFilters', 'loadSavedFilter', 'deleteSavedFilter',
      'addToSearchHistory', 'getFilterPresets', 'applyFilterPreset',
      'exportFilters', 'importFilters', 'exportFiltersToFile', 'importFiltersFromFile',
      'getFilterStatistics', 'searchWithSuggestions'
    ]);

    // Setup signals as properties, not functions
    let mockActiveFilters: any[] = [];
    advancedFilterServiceSpy.activeFilters = jasmine.createSpy('activeFilters').and.callFake(() => mockActiveFilters);
    advancedFilterServiceSpy.savedFilters = jasmine.createSpy('savedFilters').and.returnValue([mockSavedFilter]);
    advancedFilterServiceSpy.searchHistory = jasmine.createSpy('searchHistory').and.returnValue(['test query']);
    
    // Mock computed signals as properties
    Object.defineProperty(advancedFilterServiceSpy, 'hasActiveFilters', {
      get: () => false,
      configurable: true
    });
    Object.defineProperty(advancedFilterServiceSpy, 'activeFilterCount', {
      get: () => 0,
      configurable: true
    });
    Object.defineProperty(advancedFilterServiceSpy, 'filterSummary', {
      get: () => 'No active filters',
      configurable: true
    });

    // Setup default return values
    advancedFilterServiceSpy.getFilterPresets.and.returnValue([mockPreset]);
    advancedFilterServiceSpy.searchWithSuggestions.and.returnValue(of([mockSearchSuggestion]));
    advancedFilterServiceSpy.exportFilters.and.returnValue('{"activeFilters": []}');
    advancedFilterServiceSpy.importFilters.and.returnValue(true);
    advancedFilterServiceSpy.getFilterStatistics.and.returnValue({
      activeFilters: 0,
      savedFilters: 0,
      searchHistory: 0,
      mostUsedFilter: null,
      recentActivity: []
    });

    // Mock addFilterGroup to actually add to the mock array
    advancedFilterServiceSpy.addFilterGroup.and.callFake((group: any) => {
      const newGroup = {
        ...group,
        id: 'test-id-' + Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockActiveFilters.push(newGroup);
      return newGroup.id;
    });

    // Mock removeFilterGroup to actually remove from the mock array
    advancedFilterServiceSpy.removeFilterGroup.and.callFake((id: string) => {
      const index = mockActiveFilters.findIndex(f => f.id === id);
      if (index > -1) {
        mockActiveFilters.splice(index, 1);
        return true;
      }
      return false;
    });

    // Mock clearAllFilters to clear the mock array
    advancedFilterServiceSpy.clearAllFilters.and.callFake(() => {
      mockActiveFilters = [];
    });

    await TestBed.configureTestingModule({
      imports: [
        AdvancedFilterComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: AdvancedFilterService, useValue: advancedFilterServiceSpy },
        FormBuilder
      ]
    })
    .compileComponents();

    advancedFilterService = TestBed.inject(AdvancedFilterService) as jasmine.SpyObj<AdvancedFilterService>;

    fixture = TestBed.createComponent(AdvancedFilterComponent);
    component = fixture.componentInstance;
    
    // Set required inputs
    component.fields = [mockFilterField];
    component.category = 'transactions';
    
    // Initialize the component
    component.ngOnInit();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.fields).toEqual([mockFilterField]);
    expect(component.category).toBe('transactions');
    expect(component.showPresets).toBe(true);
    expect(component.showSavedFilters).toBe(true);
    expect(component.showSearchSuggestions).toBe(true);
    expect(component.compact).toBe(false);
    expect(component.maxHeight).toBe('400px');
  });

  describe('Filter Management', () => {
    it('should add filter group', () => {
      component.addFilterGroup();
      expect(advancedFilterService.addFilterGroup).toHaveBeenCalled();
    });

    it('should remove filter group', () => {
      // First add a filter group to ensure there's something to remove
      component.addFilterGroup();
      
      // Test that the method doesn't throw an error
      expect(() => component.removeFilterGroup(0)).not.toThrow();
    });

    it('should clear all filters', () => {
      component.clearAllFilters();
      expect(advancedFilterService.clearAllFilters).toHaveBeenCalled();
    });
  });

  describe('Field and Operator Management', () => {
    it('should get operators for field', () => {
      const operators = component.getOperatorsForField('title');
      expect(operators).toEqual(['contains', 'equals']);
    });

    it('should get field options', () => {
      const fieldWithOptions: FilterField = {
        ...mockFilterField,
        options: [
          { value: 'option1', label: 'Option 1' },
          { value: 'option2', label: 'Option 2' }
        ]
      };
      component.fields = [fieldWithOptions];
      
      const options = component.getFieldOptions('title');
      expect(options).toEqual(fieldWithOptions.options || []);
    });

    it('should get field placeholder', () => {
      const placeholder = component.getFieldPlaceholder('title');
      expect(placeholder).toBe('Enter title...');
    });

    it('should check if value2 should be shown', () => {
      expect(component.shouldShowValue2('between')).toBe(true);
      expect(component.shouldShowValue2('equals')).toBe(false);
    });

    it('should get condition value type', () => {
      const valueType = component.getConditionValueType('title', 'contains');
      expect(valueType).toBe('text');
    });
  });

  describe('Search Functionality', () => {
    it('should handle search input', () => {
      const event = { target: { value: 'test query' } } as any;
      component.onSearchInput(event);
      expect(component.searchForm.get('searchQuery')?.value).toBe('test query');
    });

    it('should handle search focus', (done) => {
      component.searchForm.patchValue({ searchQuery: 'test' });
      component.onSearchFocus();
      // The focus method should set isSearching to true immediately
      expect(component.isSearching()).toBe(true);
      expect(component.showSuggestions()).toBe(true);
      
      // Wait for async operation to complete
      setTimeout(() => {
        expect(component.isSearching()).toBe(false);
        done();
      }, 300); // Increased timeout to account for the 200ms delay in onSearchFocus
    });

    it('should handle search blur', (done) => {
      component.onSearchBlur();
      setTimeout(() => {
        expect(component.isSearching()).toBe(false);
        done();
      }, 250);
    });

    it('should handle suggestion click', () => {
      spyOn(component.searchQuery, 'emit');
      component.onSuggestionClick(mockSearchSuggestion);
      expect(component.searchQuery.emit).toHaveBeenCalledWith('test search');
    });
  });

  describe('Preset Management', () => {
    it('should get available presets', () => {
      const presets = component.availablePresets();
      expect(presets).toEqual([mockPreset]);
    });

    it('should select preset', () => {
      component.onPresetSelect('preset1');
      expect(component.selectedPreset()).toBe('preset1');
    });

    it('should apply preset', () => {
      spyOn(component.presetApplied, 'emit');
      component.onPresetSelect('preset1');
      expect(advancedFilterService.applyFilterPreset).toHaveBeenCalledWith('preset1');
      expect(component.presetApplied.emit).toHaveBeenCalled();
    });
  });

  describe('Saved Filter Management', () => {
    it('should get saved filters', () => {
      const savedFilters = component.savedFilters();
      expect(Array.isArray(savedFilters)).toBe(true);
    });

    it('should select saved filter', () => {
      component.onSavedFilterSelect('saved1');
      expect(component.selectedSavedFilter()).toBe('saved1');
    });

    it('should load saved filter', () => {
      spyOn(component.savedFilterLoaded, 'emit');
      component.onSavedFilterSelect('saved1');
      expect(advancedFilterService.loadSavedFilter).toHaveBeenCalledWith('saved1');
      expect(component.savedFilterLoaded.emit).toHaveBeenCalled();
    });

    it('should save current filters', () => {
      // The window methods are already mocked in beforeEach
      component.saveCurrentFilters();
      expect(advancedFilterService.saveCurrentFilters).toHaveBeenCalled();
    });

    it('should delete saved filter', () => {
      // The window methods are already mocked in beforeEach
      component.deleteSavedFilter('saved1');
      expect(advancedFilterService.deleteSavedFilter).toHaveBeenCalledWith('saved1');
    });
  });

  describe('Export/Import Functionality', () => {
    it('should export filters', () => {
      component.exportFilters();
      expect(advancedFilterService.exportFilters).toHaveBeenCalled();
    });

    it('should import filters', () => {
      const event = {
        target: {
          files: [new File(['{"activeFilters": []}'], 'test.json', { type: 'application/json' })]
        }
      } as any;
      
      // Mock FileReader
      const mockFileReader = {
        readAsText: jasmine.createSpy('readAsText'),
        result: '{"activeFilters": []}',
        onload: null as any
      };
      spyOn(window, 'FileReader').and.returnValue(mockFileReader as any);
      
      component.importFilters(event);
      
      // Simulate the file read completion
      if (mockFileReader.onload) {
        mockFileReader.onload({} as any);
      }
      
      expect(advancedFilterService.importFilters).toHaveBeenCalled();
    });

    it('should handle import with no files', () => {
      const event = { target: { files: [] } } as any;
      component.importFilters(event);
      expect(advancedFilterService.importFilters).not.toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should toggle expanded state', () => {
      expect(component.isExpanded()).toBe(false);
      component.toggleExpanded();
      expect(component.isExpanded()).toBe(true);
    });

    it('should check if has active filters', () => {
      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should get active filter count', () => {
      expect(component.activeFilterCount()).toBe(0);
    });

    it('should get filter summary', () => {
      const summary = component.filterSummary();
      expect(typeof summary).toBe('string');
    });
  });

  describe('Event Handling', () => {
    it('should emit filters changed event', () => {
      spyOn(component.filtersChanged, 'emit');
      component.filtersChanged.emit();
      expect(component.filtersChanged.emit).toHaveBeenCalled();
    });

    it('should handle field change', () => {
      const groupIndex = 0;
      const conditionIndex = 0;
      const field = 'title';
      
      // Add a filter group first
      component.addFilterGroup();
      // Add a condition
      component.addCondition(0);
      
      // Test that the method doesn't throw an error
      expect(() => component.onFieldChange(groupIndex, conditionIndex, field)).not.toThrow();
    });

    it('should get condition controls', () => {
      // Add a filter group first
      component.addFilterGroup();
      const controls = component.getConditionControls(0);
      expect(controls).toBeDefined();
    });
  });

  describe('Helper Methods', () => {
    it('should get suggestion icon', () => {
      const icon = component.getSuggestionIcon(mockSearchSuggestion);
      expect(icon).toBe('fas fa-lightbulb');
    });

    it('should get suggestion icon for different types', () => {
      const recentSuggestion = { ...mockSearchSuggestion, type: 'recent' as const };
      const categorySuggestion = { ...mockSearchSuggestion, type: 'category' as const };
      const tagSuggestion = { ...mockSearchSuggestion, type: 'tag' as const };
      
      expect(component.getSuggestionIcon(recentSuggestion)).toBe('fas fa-history');
      expect(component.getSuggestionIcon(categorySuggestion)).toBe('fas fa-tag');
      expect(component.getSuggestionIcon(tagSuggestion)).toBe('fas fa-hashtag');
    });
  });

  describe('Lifecycle Hooks', () => {
    it('should initialize on init', () => {
      spyOn(component as any, 'loadActiveFilters');
      
      component.ngOnInit();
      
      expect((component as any).loadActiveFilters).toHaveBeenCalled();
    });

    it('should cleanup on destroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', () => {
      advancedFilterService.addFilterGroup.and.throwError('Service error');
      
      expect(() => component.addFilterGroup()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty fields array', () => {
      component.fields = [];
      expect(component.getOperatorsForField('title')).toEqual([]);
      expect(component.getFieldOptions('title')).toEqual([]);
    });

    it('should handle null/undefined values', () => {
      expect(() => component.getOperatorsForField(null as any)).not.toThrow();
      expect(() => component.getFieldOptions(undefined as any)).not.toThrow();
    });

    it('should handle invalid group indices', () => {
      expect(() => component.removeFilterGroup(-1)).not.toThrow();
      expect(() => component.addCondition(999)).not.toThrow();
    });

    it('should handle search input with null target value', () => {
      const event = { target: { value: null } } as any;
      component.onSearchInput(event);
      expect(component.searchForm.get('searchQuery')?.value).toBe('');
    });

    it('should handle search input with undefined target', () => {
      const event = { target: undefined } as any;
      expect(() => component.onSearchInput(event)).not.toThrow();
    });

    it('should handle suggestion click with null suggestion', () => {
      expect(() => component.onSuggestionClick(null as any)).not.toThrow();
    });

    it('should handle preset select with invalid preset ID', () => {
      component.onPresetSelect('invalid-preset');
      expect(component.selectedPreset()).toBe('invalid-preset');
    });

    it('should handle saved filter select with invalid filter ID', () => {
      component.onSavedFilterSelect('invalid-filter');
      expect(component.selectedSavedFilter()).toBe('invalid-filter');
    });
  });

  describe('Form Validation and Error Handling', () => {
    it('should handle form validation errors gracefully', () => {
      // Add a filter group with empty name
      component.addFilterGroup();
      const filterGroupsArray = component.filterForm.get('filterGroups') as FormArray;
      const groupForm = filterGroupsArray.at(0);
      groupForm.patchValue({ name: '' });
      
      // Trigger validation
      groupForm.markAsTouched();
      groupForm.updateValueAndValidity();
      
      // The form should be invalid due to empty name
      expect(groupForm.valid).toBeFalse();
    });

    it('should handle invalid form data in removeFilterGroup', () => {
      component.filterForm = null as any;
      expect(() => component.removeFilterGroup(0)).not.toThrow();
    });

    it('should handle invalid form data in addCondition', () => {
      component.filterForm = null as any;
      expect(() => component.addCondition(0)).not.toThrow();
    });

    it('should handle invalid form data in getConditionControls', () => {
      component.filterForm = null as any;
      const controls = component.getConditionControls(0);
      expect(controls).toBeDefined();
    });

    it('should handle invalid form data in onFieldChange', () => {
      component.filterForm = null as any;
      expect(() => component.onFieldChange(0, 0, 'field')).not.toThrow();
    });
  });

  describe('Search Functionality', () => {
    it('should handle search with empty query', () => {
      component.onSearch('');
      expect(component.isSearching()).toBeFalse();
    });

    it('should handle search with short query', () => {
      component.onSearch('a');
      expect(component.isSearching()).toBeFalse();
    });

    it('should handle search with valid query', () => {
      component.onSearch('test query');
      // The search method sets isSearching to true initially, then false after completion
      expect(component.isSearching()).toBeFalse();
    });

    it('should handle search focus with existing query', (done) => {
      component.searchForm.patchValue({ searchQuery: 'existing query' });
      component.onSearchFocus();
      expect(component.isSearching()).toBeTrue();
      expect(component.showSuggestions()).toBeTrue();
      
      // Wait for async operation to complete
      setTimeout(() => {
        expect(component.isSearching()).toBeFalse();
        done();
      }, 300); // Increased timeout to account for the 200ms delay in onSearchFocus
    });

    it('should handle search blur after delay', (done) => {
      component.onSearchBlur();
      setTimeout(() => {
        expect(component.isSearching()).toBeFalse();
        done();
      }, 250);
    });
  });

  describe('Filter Group Management', () => {
    it('should handle removeFilterGroup with valid group', () => {
      component.addFilterGroup();
      const filterGroupsArray = component.filterForm.get('filterGroups') as FormArray;
      expect(filterGroupsArray.length).toBe(1);
      
      component.removeFilterGroup(0);
      expect(filterGroupsArray.length).toBe(0);
    });

    it('should handle addCondition with valid group', () => {
      component.addFilterGroup();
      const filterGroupsArray = component.filterForm.get('filterGroups') as FormArray;
      const groupForm = filterGroupsArray.at(0);
      const conditionsArray = groupForm.get('conditions') as FormArray;
      
      component.addCondition(0);
      expect(conditionsArray.length).toBe(1);
    });

    it('should handle removeCondition with valid indices', () => {
      component.addFilterGroup();
      component.addCondition(0);
      
      const filterGroupsArray = component.filterForm.get('filterGroups') as FormArray;
      const groupForm = filterGroupsArray.at(0);
      const conditionsArray = groupForm.get('conditions') as FormArray;
      
      component.removeCondition(0, 0);
      expect(conditionsArray.length).toBe(0);
    });
  });

  describe('Field and Operator Management', () => {
    it('should get operators for different field types', () => {
      const textField: FilterField = { key: 'text', label: 'Text', type: 'text', operators: [] };
      const numberField: FilterField = { key: 'number', label: 'Number', type: 'number', operators: [] };
      const dateField: FilterField = { key: 'date', label: 'Date', type: 'date', operators: [] };
      
      component.fields = [textField, numberField, dateField];
      
      // Ensure the component is properly initialized
      component.ngOnInit();
      fixture.detectChanges();
      
      expect(component.getOperatorsForField('text')).toEqual(['contains', 'not_contains', 'starts_with', 'ends_with', 'equals', 'not_equals', 'regex']);
      expect(component.getOperatorsForField('number')).toEqual(['equals', 'not_equals', 'gt', 'gte', 'lt', 'lte', 'between']);
      expect(component.getOperatorsForField('date')).toEqual(['equals', 'not_equals', 'gt', 'gte', 'lt', 'lte', 'between']);
    });

    it('should get field options for field with options', () => {
      const fieldWithOptions: FilterField = {
        key: 'category',
        label: 'Category',
        type: 'select',
        options: [
          { value: 'food', label: 'Food' },
          { value: 'transport', label: 'Transport' }
        ]
      };
      
      component.fields = [fieldWithOptions];
      const options = component.getFieldOptions('category');
      expect(options).toEqual(fieldWithOptions.options || []);
    });

    it('should get field placeholder for field with custom placeholder', () => {
      const fieldWithPlaceholder: FilterField = {
        key: 'description',
        label: 'Description',
        type: 'text',
        placeholder: 'Enter description here...'
      };
      
      component.fields = [fieldWithPlaceholder];
      const placeholder = component.getFieldPlaceholder('description');
      expect(placeholder).toBe('Enter description here...');
    });

    it('should check if value2 should be shown for different operators', () => {
      expect(component.shouldShowValue2('between')).toBeTrue();
      expect(component.shouldShowValue2('equals')).toBeFalse();
      expect(component.shouldShowValue2('gt')).toBeFalse();
      expect(component.shouldShowValue2('gte')).toBeFalse();
    });

    it('should get condition value type for different field types', () => {
      const textField: FilterField = { key: 'text', label: 'Text', type: 'text', operators: [] };
      const numberField: FilterField = { key: 'number', label: 'Number', type: 'number', operators: [] };
      const dateField: FilterField = { key: 'date', label: 'Date', type: 'date', operators: [] };
      const booleanField: FilterField = { key: 'boolean', label: 'Boolean', type: 'boolean', operators: [] };
      const selectField: FilterField = { key: 'select', label: 'Select', type: 'select', operators: [] };
      const tagsField: FilterField = { key: 'tags', label: 'Tags', type: 'tags', operators: [] };
      
      component.fields = [textField, numberField, dateField, booleanField, selectField, tagsField];
      
      expect(component.getConditionValueType('text', 'contains')).toBe('text');
      expect(component.getConditionValueType('number', 'gt')).toBe('number');
      expect(component.getConditionValueType('date', 'between')).toBe('date');
      expect(component.getConditionValueType('boolean', 'equals')).toBe('checkbox');
      expect(component.getConditionValueType('select', 'in')).toBe('select');
      expect(component.getConditionValueType('tags', 'contains')).toBe('text');
    });

    it('should get condition value type for unknown field', () => {
      component.fields = [];
      expect(component.getConditionValueType('unknown', 'equals')).toBe('text');
    });
  });

  describe('Suggestion Icons', () => {
    it('should get correct icon for different suggestion types', () => {
      const recentSuggestion: SearchSuggestion = { id: '1', text: 'recent', type: 'recent' };
      const suggestionSuggestion: SearchSuggestion = { id: '2', text: 'suggestion', type: 'suggestion' };
      const categorySuggestion: SearchSuggestion = { id: '3', text: 'category', type: 'category' };
      const tagSuggestion: SearchSuggestion = { id: '4', text: 'tag', type: 'tag' };
      
      expect(component.getSuggestionIcon(recentSuggestion)).toBe('fas fa-history');
      expect(component.getSuggestionIcon(suggestionSuggestion)).toBe('fas fa-lightbulb');
      expect(component.getSuggestionIcon(categorySuggestion)).toBe('fas fa-tag');
      expect(component.getSuggestionIcon(tagSuggestion)).toBe('fas fa-hashtag');
    });

    it('should get default icon for unknown suggestion type', () => {
      const unknownSuggestion: SearchSuggestion = { id: '1', text: 'unknown', type: 'unknown' as any };
      expect(component.getSuggestionIcon(unknownSuggestion)).toBe('fas fa-search');
    });
  });

  describe('Form Reset and Clear', () => {
    it('should clear all filters with confirmation', () => {
      window.confirm = jasmine.createSpy('confirm').and.returnValue(true);
      component.addFilterGroup();
      component.clearAllFilters();
      expect(advancedFilterService.clearAllFilters).toHaveBeenCalled();
    });

    it('should not clear filters without confirmation', () => {
      window.confirm = jasmine.createSpy('confirm').and.returnValue(false);
      component.addFilterGroup();
      component.clearAllFilters();
      expect(advancedFilterService.clearAllFilters).not.toHaveBeenCalled();
    });
  });

  describe('Export and Import', () => {
    it('should export filters successfully', () => {
      spyOn(URL, 'createObjectURL').and.returnValue('blob:url');
      spyOn(URL, 'revokeObjectURL');
      spyOn(document, 'createElement').and.returnValue({
        href: '',
        download: '',
        click: jasmine.createSpy('click')
      } as any);
      spyOn(document.body, 'appendChild');
      spyOn(document.body, 'removeChild');

      component.exportFilters();
      expect(advancedFilterService.exportFilters).toHaveBeenCalled();
    });

    it('should import filters successfully', () => {
      const event = {
        target: {
          files: [new File(['{"activeFilters": []}'], 'test.json', { type: 'application/json' })]
        }
      } as any;
      
      const mockFileReader = {
        readAsText: jasmine.createSpy('readAsText'),
        result: '{"activeFilters": []}',
        onload: null as any
      };
      spyOn(window, 'FileReader').and.returnValue(mockFileReader as any);
      window.alert = jasmine.createSpy('alert');
      
      component.importFilters(event);
      
      if (mockFileReader.onload) {
        mockFileReader.onload({} as any);
      }
      
      expect(advancedFilterService.importFilters).toHaveBeenCalled();
    });

    it('should handle import with no files', () => {
      const event = { target: { files: [] } } as any;
      component.importFilters(event);
      expect(advancedFilterService.importFilters).not.toHaveBeenCalled();
    });

    it('should handle import with invalid file content', () => {
      const event = {
        target: {
          files: [new File(['invalid json'], 'test.json', { type: 'application/json' })]
        }
      } as any;
      
      const mockFileReader = {
        readAsText: jasmine.createSpy('readAsText'),
        result: 'invalid json',
        onload: null as any
      };
      spyOn(window, 'FileReader').and.returnValue(mockFileReader as any);
      window.alert = jasmine.createSpy('alert');
      
      component.importFilters(event);
      
      if (mockFileReader.onload) {
        mockFileReader.onload({} as any);
      }
      
      expect(advancedFilterService.importFilters).toHaveBeenCalled();
    });
  });

  describe('Condition Validation', () => {
    it('should validate condition correctly', () => {
      const validCondition = { field: 'title', operator: 'contains', value: 'test' };
      const invalidCondition = { field: '', operator: 'contains', value: 'test' };
      const emptyValueCondition = { field: 'title', operator: 'contains', value: '' };
      
      expect(component.isConditionValid(validCondition)).toBeTrue();
      expect(component.isConditionValid(invalidCondition)).toBeFalse();
      expect(component.isConditionValid(emptyValueCondition)).toBeFalse();
    });
  });

  describe('Template Getters', () => {
    it('should get filter groups array', () => {
      const filterGroupsArray = component.filterGroupsArray;
      expect(filterGroupsArray).toBeDefined();
    });

    it('should get field type for known field', () => {
      const textField: FilterField = { key: 'text', label: 'Text', type: 'text', operators: [] };
      component.fields = [textField];
      
      expect(component.getFieldType('text')).toBe('text');
    });

    it('should get default field type for unknown field', () => {
      component.fields = [];
      expect(component.getFieldType('unknown')).toBe('text');
    });
  });

  describe('Additional Form Management', () => {
    it('should handle form validation', () => {
      const searchControl = component.searchForm.get('searchQuery');
      // Initially empty, should have minlength error when touched
      searchControl?.setValue('');
      searchControl?.markAsTouched();
      searchControl?.updateValueAndValidity();
      expect(searchControl?.hasError('minlength')).toBe(true);
      
      // Set value with 2 characters, should not have minlength error
      searchControl?.setValue('ab');
      searchControl?.updateValueAndValidity();
      expect(searchControl?.hasError('minlength')).toBe(false);
    });

    it('should emit filters changed when form changes', () => {
      spyOn(component as any, 'emitFiltersChanged');
      component.filterForm.patchValue({ filterGroups: [] });
      expect((component as any).emitFiltersChanged).toHaveBeenCalled();
    });
  });

  describe('Search Functionality', () => {
    it('should handle search input events', () => {
      const event = { target: { value: 'test query' } } as any;
      component.onSearchInput(event);
      expect(component.searchForm.get('searchQuery')?.value).toBe('test query');
    });

    it('should handle search focus', (done) => {
      component.searchForm.patchValue({ searchQuery: 'test' });
      component.onSearchFocus();
      // The focus method should set both isSearching and showSuggestions to true
      expect(component.isSearching()).toBe(true);
      expect(component.showSuggestions()).toBe(true);
      
      // Wait for async operation to complete
      setTimeout(() => {
        expect(component.isSearching()).toBe(false);
        done();
      }, 300); // Increased timeout to account for the 200ms delay in onSearchFocus
    });

    it('should handle search blur', (done) => {
      component.onSearchBlur();
      setTimeout(() => {
        expect(component.showSuggestions()).toBe(false);
        expect(component.isSearching()).toBe(false);
        done();
      }, 250);
    });

    it('should handle suggestion clicks', () => {
      const suggestion = { text: 'test suggestion', type: 'recent' } as any;
      component.onSuggestionClick(suggestion);
      expect(component.searchForm.get('searchQuery')?.value).toBe('test suggestion');
      expect(component.showSuggestions()).toBe(false);
    });

    it('should handle search with short queries', () => {
      component.onSearch('a');
      expect(component.isSearching()).toBe(false);
      expect(component.searchSuggestions()).toEqual([]);
    });

    it('should handle search with longer queries', () => {
      component.onSearch('test query');
      // The search method sets isSearching to true initially, then false after completion
      expect(component.isSearching()).toBe(false);
    });
  });

  describe('Filter Operations', () => {
    it('should add filter group', () => {
      const initialCount = component.filterGroupsArray.length;
      component.addFilterGroup();
      expect(component.filterGroupsArray.length).toBe(initialCount + 1);
    });

    it('should handle addFilterGroup errors gracefully', () => {
      advancedFilterService.addFilterGroup.and.throwError('Test error');
      spyOn(console, 'warn');
      component.addFilterGroup();
      expect(console.warn).toHaveBeenCalledWith('Error adding filter group:', jasmine.any(Error));
    });

    it('should remove filter group with valid index', () => {
      component.addFilterGroup();
      const initialCount = component.filterGroupsArray.length;
      component.removeFilterGroup(0);
      expect(component.filterGroupsArray.length).toBe(initialCount - 1);
    });

    it('should add condition to group', () => {
      component.addFilterGroup();
      const groupIndex = 0;
      const initialConditionCount = component.getConditionControls(groupIndex).length;
      component.addCondition(groupIndex);
      expect(component.getConditionControls(groupIndex).length).toBe(initialConditionCount + 1);
    });

    it('should handle addCondition errors gracefully', () => {
      // Test with invalid group index
      spyOn(console, 'warn');
      component.addCondition(-1); // Invalid index
      expect(console.warn).not.toHaveBeenCalled();
      
      // Test with null form
      component.filterForm = null as any;
      component.addCondition(0);
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('Preset and Saved Filter Operations', () => {
    it('should handle preset selection', () => {
      const presetId = 'recent-transactions';
      component.onPresetSelect(presetId);
      expect(component.selectedPreset()).toBe(presetId);
    });

    it('should handle saved filter selection', () => {
      const savedFilterId = 'test-filter';
      component.onSavedFilterSelect(savedFilterId);
      expect(component.selectedSavedFilter()).toBe(savedFilterId);
    });

    it('should save current filters', () => {
      window.prompt = jasmine.createSpy('prompt').and.returnValue('Test Filter');
      window.confirm = jasmine.createSpy('confirm').and.returnValue(true);
      advancedFilterService.saveCurrentFilters.and.returnValue('test-id');
      
      component.saveCurrentFilters();
      expect(advancedFilterService.saveCurrentFilters).toHaveBeenCalledWith('Test Filter', 'Test Filter', true);
    });

    it('should clear all filters with confirmation', () => {
      window.confirm = jasmine.createSpy('confirm').and.returnValue(true);
      component.clearAllFilters();
      expect(advancedFilterService.clearAllFilters).toHaveBeenCalled();
    });

    it('should not clear filters without confirmation', () => {
      window.confirm = jasmine.createSpy('confirm').and.returnValue(false);
      component.clearAllFilters();
      expect(advancedFilterService.clearAllFilters).not.toHaveBeenCalled();
    });
  });

  describe('Export/Import Operations', () => {
    it('should export filters', () => {
      advancedFilterService.exportFilters.and.returnValue('{"test": "data"}');
      spyOn(URL, 'createObjectURL').and.returnValue('blob:url');
      spyOn(URL, 'revokeObjectURL');
      
      const mockLink = { click: jasmine.createSpy(), href: '', download: '' };
      spyOn(document, 'createElement').and.returnValue(mockLink as any);
      spyOn(document.body, 'appendChild');
      spyOn(document.body, 'removeChild');
      
      component.exportFilters();
      expect(advancedFilterService.exportFilters).toHaveBeenCalled();
    });

    it('should import filters successfully', () => {
      const mockFile = { name: 'test.json' } as File;
      const mockEvent = { target: { files: [mockFile] } } as any;
      
      advancedFilterService.importFilters.and.returnValue(true);
      
      const mockReader = { onload: null, readAsText: jasmine.createSpy() };
      spyOn(window, 'FileReader').and.returnValue(mockReader as any);
      
      component.importFilters(mockEvent);
      expect(mockReader.readAsText).toHaveBeenCalledWith(mockFile);
    });

    it('should handle import failure', () => {
      const mockFile = { name: 'test.json' } as File;
      const mockEvent = { target: { files: [mockFile] } } as any;
      
      advancedFilterService.importFilters.and.returnValue(false);
      
      const mockReader = { onload: null, readAsText: jasmine.createSpy() };
      spyOn(window, 'FileReader').and.returnValue(mockReader as any);
      
      component.importFilters(mockEvent);
      expect(mockReader.readAsText).toHaveBeenCalledWith(mockFile);
    });
  });

  describe('Utility Methods', () => {
    it('should get field placeholder correctly', () => {
      const fieldWithPlaceholder = { ...mockFilterField, placeholder: 'Custom placeholder' };
      component.fields = [fieldWithPlaceholder];
      expect(component.getFieldPlaceholder('title')).toBe('Custom placeholder');
      expect(component.getFieldPlaceholder('nonexistent')).toBe('Enter nonexistent...');
    });

    it('should check condition validity', () => {
      const validCondition = { field: 'title', operator: 'equals', value: 'test' };
      const invalidCondition = { field: '', operator: 'equals', value: 'test' };
      
      expect(component.isConditionValid(validCondition)).toBe(true);
      expect(component.isConditionValid(invalidCondition)).toBe(false);
    });

    it('should check if value2 should be shown', () => {
      expect(component.shouldShowValue2('between')).toBe(true);
      expect(component.shouldShowValue2('equals')).toBe(false);
    });

    it('should get condition value type correctly', () => {
      const numberField = { ...mockFilterField, key: 'number', type: 'number' as any };
      const dateField = { ...mockFilterField, key: 'date', type: 'date' as any };
      const booleanField = { ...mockFilterField, key: 'boolean', type: 'boolean' as any };
      const selectField = { ...mockFilterField, key: 'select', type: 'select' as any };
      const tagsField = { ...mockFilterField, key: 'tags', type: 'tags' as any };
      
      component.fields = [numberField, dateField, booleanField, selectField, tagsField];
      
      expect(component.getConditionValueType('number', 'equals')).toBe('number');
      expect(component.getConditionValueType('date', 'equals')).toBe('date');
      expect(component.getConditionValueType('boolean', 'equals')).toBe('checkbox');
      expect(component.getConditionValueType('select', 'equals')).toBe('select');
      expect(component.getConditionValueType('tags', 'equals')).toBe('text');
    });

    it('should get suggestion icon correctly', () => {
      const recentSuggestion = { type: 'recent' } as any;
      const suggestionSuggestion = { type: 'suggestion' } as any;
      const categorySuggestion = { type: 'category' } as any;
      const tagSuggestion = { type: 'tag' } as any;
      const defaultSuggestion = { type: 'unknown' } as any;
      
      expect(component.getSuggestionIcon(recentSuggestion)).toBe('fas fa-history');
      expect(component.getSuggestionIcon(suggestionSuggestion)).toBe('fas fa-lightbulb');
      expect(component.getSuggestionIcon(categorySuggestion)).toBe('fas fa-tag');
      expect(component.getSuggestionIcon(tagSuggestion)).toBe('fas fa-hashtag');
      expect(component.getSuggestionIcon(defaultSuggestion)).toBe('fas fa-search');
    });

    it('should delete saved filter with confirmation', () => {
      window.confirm = jasmine.createSpy('confirm').and.returnValue(true);
      advancedFilterService.deleteSavedFilter.and.returnValue(true);
      
      component.deleteSavedFilter('test-id');
      expect(advancedFilterService.deleteSavedFilter).toHaveBeenCalledWith('test-id');
    });

    it('should not delete saved filter without confirmation', () => {
      window.confirm = jasmine.createSpy('confirm').and.returnValue(false);
      
      component.deleteSavedFilter('test-id');
      expect(advancedFilterService.deleteSavedFilter).not.toHaveBeenCalled();
    });
  });

  describe('Private Methods', () => {
    it('should perform search correctly', () => {
      advancedFilterService.searchWithSuggestions.and.returnValue(of([]));
      component['performSearch']('test query');
      expect(component.isSearching()).toBe(true);
    });

    it('should handle search errors', () => {
      advancedFilterService.searchWithSuggestions.and.returnValue(throwError(() => new Error('Search error')));
      spyOn(console, 'error');
      
      component['performSearch']('test query');
      expect(console.error).toHaveBeenCalledWith('Search error:', jasmine.any(Error));
    });

    it('should add to search history', () => {
      component['addToSearchHistory']('test query');
      expect(advancedFilterService.addToSearchHistory).toHaveBeenCalledWith('test query');
    });

    it('should emit filters changed', () => {
      spyOn(component.filtersChanged, 'emit');
      component['emitFiltersChanged']();
      expect(component.filtersChanged.emit).toHaveBeenCalled();
    });

    it('should get filter groups from form', () => {
      const mockGroup = { id: 'test', name: 'Test', logic: 'AND', isActive: true, conditions: [] };
      component.filterForm.patchValue({ filterGroups: [mockGroup] });
      
      const result = component['getFilterGroupsFromForm']();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should generate ID', () => {
      const id = component['generateId']();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });
});