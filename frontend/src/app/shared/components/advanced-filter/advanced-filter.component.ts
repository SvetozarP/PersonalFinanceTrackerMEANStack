import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { AdvancedFilterService, FilterCondition, FilterGroup, SavedFilter, FilterPreset, SearchSuggestion } from '../../../core/services/advanced-filter.service';

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'numberrange' | 'boolean' | 'tags';
  options?: { value: any; label: string }[];
  placeholder?: string;
  validation?: any;
  operators?: string[];
}

@Component({
  selector: 'app-advanced-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './advanced-filter.component.html',
  styleUrls: ['./advanced-filter.component.scss']
})
export class AdvancedFilterComponent implements OnInit, OnDestroy {
  @Input() fields: FilterField[] = [];
  @Input() category: 'transactions' | 'budgets' | 'categories' | 'reports' | 'global' = 'global';
  @Input() showPresets: boolean = true;
  @Input() showSavedFilters: boolean = true;
  @Input() showSearchSuggestions: boolean = true;
  @Input() compact: boolean = false;
  @Input() maxHeight: string = '400px';

  @Output() filtersChanged = new EventEmitter<FilterGroup[]>();
  @Output() searchQuery = new EventEmitter<string>();
  @Output() presetApplied = new EventEmitter<FilterPreset>();
  @Output() savedFilterLoaded = new EventEmitter<SavedFilter>();

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Form management
  filterForm!: FormGroup;
  searchForm!: FormGroup;

  // State management
  private _isExpanded = signal(false);
  private _isSearching = signal(false);
  private _searchSuggestions = signal<SearchSuggestion[]>([]);
  private _showSuggestions = signal(false);
  private _selectedPreset = signal<string | null>(null);
  private _selectedSavedFilter = signal<string | null>(null);

  // Public observables
  public isExpanded = this._isExpanded.asReadonly();
  public isSearching = this._isSearching.asReadonly();
  public searchSuggestions = this._searchSuggestions.asReadonly();
  public showSuggestions = this._showSuggestions.asReadonly();
  public selectedPreset = this._selectedPreset.asReadonly();
  public selectedSavedFilter = this._selectedSavedFilter.asReadonly();

  // Computed properties
  public hasActiveFilters = computed(() => this.advancedFilterService.hasActiveFilters);
  public activeFilterCount = computed(() => this.advancedFilterService.activeFilterCount);
  public filterSummary = computed(() => this.advancedFilterService.filterSummary);
  public availablePresets = computed(() => this.advancedFilterService.getFilterPresets(this.category));
  public savedFilters = computed(() => this.advancedFilterService.savedFilters());

  constructor(
    private fb: FormBuilder,
    private advancedFilterService: AdvancedFilterService
  ) {}

  // Filter operators
  readonly OPERATORS = {
    text: ['contains', 'not_contains', 'starts_with', 'ends_with', 'equals', 'not_equals', 'regex'],
    select: ['equals', 'not_equals', 'in', 'not_in'],
    multiselect: ['in', 'not_in'],
    date: ['equals', 'not_equals', 'gt', 'gte', 'lt', 'lte', 'between'],
    daterange: ['between'],
    number: ['equals', 'not_equals', 'gt', 'gte', 'lt', 'lte', 'between'],
    numberrange: ['between'],
    boolean: ['equals', 'not_equals'],
    tags: ['contains', 'not_contains', 'in', 'not_in']
  };

  ngOnInit(): void {
    this.initializeForms();
    this.loadActiveFilters();
    this.setupFilterFormSubscriptions();
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.filterForm = this.fb.group({
      filterGroups: this.fb.array([])
    });

    this.searchForm = this.fb.group({
      searchQuery: ['', Validators.minLength(2)]
    });
  }

  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      if (query.length >= 2) {
        this.performSearch(query);
      } else {
        this._searchSuggestions.set([]);
        this._showSuggestions.set(false);
      }
    });
  }

  private setupFilterFormSubscriptions(): void {
    this.filterForm.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.emitFiltersChanged();
    });
  }

  private loadActiveFilters(): void {
    const activeFilters = this.advancedFilterService.activeFilters();
    this.populateFilterForm(activeFilters);
  }

  private populateFilterForm(filterGroups: FilterGroup[]): void {
    const filterGroupsArray = this.filterForm.get('filterGroups') as FormArray;
    filterGroupsArray.clear();

    filterGroups.forEach(group => {
      const groupForm = this.createFilterGroupForm(group);
      filterGroupsArray.push(groupForm);
    });
  }

  private createFilterGroupForm(group: FilterGroup): FormGroup {
    const groupForm = this.fb.group({
      id: [group.id],
      name: [group.name, Validators.required],
      logic: [group.logic, Validators.required],
      isActive: [group.isActive],
      conditions: this.fb.array([])
    });

    const conditionsArray = groupForm.get('conditions') as FormArray;
    group.conditions.forEach(condition => {
      const conditionForm = this.createConditionForm(condition);
      conditionsArray.push(conditionForm);
    });

    return groupForm;
  }

  private createConditionForm(condition: FilterCondition): FormGroup {
    return this.fb.group({
      field: [condition.field, Validators.required],
      operator: [condition.operator, Validators.required],
      value: [condition.value],
      value2: [condition.value2]
    });
  }

  // Public methods
  toggleExpanded(): void {
    this._isExpanded.update(expanded => !expanded);
  }

  addFilterGroup(): void {
    try {
      const newGroup: Omit<FilterGroup, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'New Filter Group',
        conditions: [],
        logic: 'AND',
        isActive: true
      };

      const groupId = this.advancedFilterService.addFilterGroup(newGroup);
      this.loadActiveFilters();
    } catch (error) {
      console.warn('Error adding filter group:', error);
    }
  }

  removeFilterGroup(groupIndex: number): void {
    if (!this.filterForm) {
      return;
    }
    
    const filterGroupsArray = this.filterForm.get('filterGroups') as FormArray;
    if (!filterGroupsArray || groupIndex < 0 || groupIndex >= filterGroupsArray.length) {
      return;
    }
    
    try {
      const groupForm = filterGroupsArray.at(groupIndex);
      const groupId = groupForm.get('id')?.value;

      if (groupId) {
        this.advancedFilterService.removeFilterGroup(groupId);
      }

      filterGroupsArray.removeAt(groupIndex);
      this.emitFiltersChanged();
    } catch (error) {
      // Handle any errors gracefully
      console.warn('Error removing filter group:', error);
    }
  }

  addCondition(groupIndex: number): void {
    if (!this.filterForm) {
      return;
    }
    
    const filterGroupsArray = this.filterForm.get('filterGroups') as FormArray;
    if (!filterGroupsArray || groupIndex < 0 || groupIndex >= filterGroupsArray.length) {
      return;
    }
    
    try {
      const groupForm = filterGroupsArray.at(groupIndex);
      const conditionsArray = groupForm.get('conditions') as FormArray;

      const newCondition = this.createConditionForm({
        field: '',
        operator: 'equals',
        value: '',
        value2: ''
      });

      conditionsArray.push(newCondition);
      this.emitFiltersChanged();
    } catch (error) {
      // Handle any errors gracefully
      console.warn('Error adding condition:', error);
    }
  }

  removeCondition(groupIndex: number, conditionIndex: number): void {
    const filterGroupsArray = this.filterForm.get('filterGroups') as FormArray;
    const groupForm = filterGroupsArray.at(groupIndex);
    const conditionsArray = groupForm.get('conditions') as FormArray;

    conditionsArray.removeAt(conditionIndex);
    this.emitFiltersChanged();
  }

  getOperatorsForField(fieldKey: string): string[] {
    const field = this.fields.find(f => f.key === fieldKey);
    if (!field) return [];

    const fieldOperators = this.OPERATORS[field.type] || [];
    return field.operators ? field.operators : fieldOperators;
  }

  getFieldOptions(fieldKey: string): { value: any; label: string }[] {
    const field = this.fields.find(f => f.key === fieldKey);
    return field?.options || [];
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (!target) return;
    
    const query = target.value || '';
    this.searchForm.patchValue({ searchQuery: query });
    this.searchSubject.next(query);
  }

  onSearch(query: string): void {
    this._isSearching.set(true);
    if (query && query.length > 2) {
      this.advancedFilterService.searchWithSuggestions(query)
        .pipe(takeUntil(this.destroy$))
        .subscribe(suggestions => {
          this._searchSuggestions.set(suggestions);
          this._showSuggestions.set(true);
          this._isSearching.set(false);
        });
    } else {
      this._searchSuggestions.set([]);
      this._showSuggestions.set(false);
      this._isSearching.set(false);
    }
    this.searchQuery.emit(query);
  }

  onSearchFocus(): void {
    this._isSearching.set(true);
    this._showSuggestions.set(true);
    if (this.searchForm.get('searchQuery')?.value) {
      this.performSearch(this.searchForm.get('searchQuery')?.value);
    }
  }

  onSearchBlur(): void {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      this._showSuggestions.set(false);
      this._isSearching.set(false);
    }, 200);
  }

  onSuggestionClick(suggestion: SearchSuggestion): void {
    if (!suggestion || !suggestion.text) return;
    
    this.searchForm.patchValue({ searchQuery: suggestion.text });
    this._showSuggestions.set(false);
    this.addToSearchHistory(suggestion.text);
    this.searchQuery.emit(suggestion.text);
  }

  onPresetSelect(presetId: string): void {
    this._selectedPreset.set(presetId);
    const preset = this.availablePresets().find(p => p.id === presetId);
    if (preset) {
      this.advancedFilterService.applyFilterPreset(presetId);
      this.loadActiveFilters();
      this.presetApplied.emit(preset);
    }
  }

  onSavedFilterSelect(savedFilterId: string): void {
    this._selectedSavedFilter.set(savedFilterId);
    const savedFilter = this.savedFilters().find((sf: SavedFilter) => sf.id === savedFilterId);
    if (savedFilter) {
      this.advancedFilterService.loadSavedFilter(savedFilterId);
      this.loadActiveFilters();
      this.savedFilterLoaded.emit(savedFilter);
    }
  }

  saveCurrentFilters(): void {
    const name = prompt('Enter a name for this filter:');
    if (name) {
      const description = prompt('Enter a description (optional):') || undefined;
      const isGlobal = confirm('Make this filter available globally?');
      
      this.advancedFilterService.saveCurrentFilters(name, description, isGlobal);
    }
  }

  clearAllFilters(): void {
    if (confirm('Are you sure you want to clear all filters?')) {
      this.advancedFilterService.clearAllFilters();
      this.loadActiveFilters();
    }
  }

  exportFilters(): void {
    const config = this.advancedFilterService.exportFilters();
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'filter-config.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  importFilters(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (this.advancedFilterService.importFilters(content)) {
          this.loadActiveFilters();
          alert('Filters imported successfully!');
        } else {
          alert('Failed to import filters. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  }

  // Private methods
  private performSearch(query: string): void {
    this._isSearching.set(true);
    
    this.advancedFilterService.searchWithSuggestions(query, this.category)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (suggestions) => {
          this._searchSuggestions.set(suggestions);
          this._isSearching.set(false);
        },
        error: (error) => {
          console.error('Search error:', error);
          this._isSearching.set(false);
        }
      });
  }

  private addToSearchHistory(query: string): void {
    this.advancedFilterService.addToSearchHistory(query);
  }

  private emitFiltersChanged(): void {
    const filterGroups = this.getFilterGroupsFromForm();
    this.filtersChanged.emit(filterGroups);
  }

  private getFilterGroupsFromForm(): FilterGroup[] {
    const filterGroupsArray = this.filterForm.get('filterGroups') as FormArray;
    return filterGroupsArray.value.map((group: any) => ({
      id: group.id || this.generateId(),
      name: group.name,
      logic: group.logic,
      isActive: group.isActive,
      conditions: group.conditions.map((condition: any) => ({
        field: condition.field,
        operator: condition.operator,
        value: condition.value,
        value2: condition.value2
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Getters for template
  get filterGroupsArray(): FormArray {
    return this.filterForm.get('filterGroups') as FormArray;
  }

  getFieldType(fieldKey: string): string {
    const field = this.fields.find(f => f.key === fieldKey);
    return field?.type || 'text';
  }

  getFieldPlaceholder(fieldKey: string): string {
    const field = this.fields.find(f => f.key === fieldKey);
    if (field?.placeholder) {
      return field.placeholder;
    }
    // Generate a default placeholder based on field key
    return `Enter ${fieldKey}...`;
  }

  isConditionValid(condition: any): boolean {
    return !!(condition && condition.field && condition.operator && condition.value !== '');
  }

  shouldShowValue2(operator: string): boolean {
    return operator === 'between';
  }

  getConditionValueType(fieldKey: string, operator: string): string {
    const field = this.fields.find(f => f.key === fieldKey);
    if (!field) return 'text';

    if (field.type === 'number' || field.type === 'numberrange') return 'number';
    if (field.type === 'date' || field.type === 'daterange') return 'date';
    if (field.type === 'boolean') return 'checkbox';
    if (field.type === 'select' || field.type === 'multiselect') return 'select';
    if (field.type === 'tags') return 'text';
    return 'text';
  }

  // Additional methods for template
  getSuggestionIcon(suggestion: SearchSuggestion): string {
    switch (suggestion.type) {
      case 'recent':
        return 'fas fa-history';
      case 'suggestion':
        return 'fas fa-lightbulb';
      case 'category':
        return 'fas fa-tag';
      case 'tag':
        return 'fas fa-hashtag';
      default:
        return 'fas fa-search';
    }
  }

  deleteSavedFilter(savedFilterId: string): void {
    if (confirm('Are you sure you want to delete this saved filter?')) {
      this.advancedFilterService.deleteSavedFilter(savedFilterId);
    }
  }

  onFieldChange(groupIndex: number, conditionIndex: number, field: string): void {
    if (!this.filterForm) {
      return;
    }
    
    try {
      // Reset operator and value when field changes
      const filterGroupsArray = this.filterForm.get('filterGroups') as FormArray;
      if (!filterGroupsArray || groupIndex < 0 || groupIndex >= filterGroupsArray.length) {
        return;
      }
      
      const groupForm = filterGroupsArray.at(groupIndex);
      const conditionsArray = groupForm.get('conditions') as FormArray;
      if (!conditionsArray || conditionIndex < 0 || conditionIndex >= conditionsArray.length) {
        return;
      }
      
      const conditionForm = conditionsArray.at(conditionIndex);
      conditionForm.patchValue({
        operator: 'equals',
        value: '',
        value2: ''
      });
    } catch (error) {
      console.warn('Error handling field change:', error);
    }
  }


  getConditionControls(groupIndex: number): FormArray {
    if (!this.filterForm) {
      return this.fb.array([]);
    }
    
    try {
      const filterGroupsArray = this.filterForm.get('filterGroups') as FormArray;
      if (!filterGroupsArray || groupIndex < 0 || groupIndex >= filterGroupsArray.length) {
        return this.fb.array([]);
      }
      
      const groupForm = filterGroupsArray.at(groupIndex);
      return groupForm.get('conditions') as FormArray || this.fb.array([]);
    } catch (error) {
      console.warn('Error getting condition controls:', error);
      return this.fb.array([]);
    }
  }
}
