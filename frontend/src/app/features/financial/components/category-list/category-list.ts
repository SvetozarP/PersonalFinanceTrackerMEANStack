import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, switchMap, of } from 'rxjs';
import { Category, CategoryStats, QueryOptions } from '../../../../core/models/financial.model';
import { CategoryService } from '../../../../core/services/category.service';
import { AdvancedFilterService, FilterGroup } from '../../../../core/services/advanced-filter.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner';
import { AdvancedFilterComponent, FilterField } from '../../../../shared/components/advanced-filter/advanced-filter.component';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    LoadingSpinnerComponent,
    AdvancedFilterComponent
  ],
  templateUrl: './category-list.html',
  styleUrls: ['./category-list.scss']
})
export class CategoryListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private categoryService = inject(CategoryService);
  private advancedFilterService = inject(AdvancedFilterService);

  // Setup advanced filters effect in field initializer
  private filterEffect = effect(() => {
    const filters = this.advancedFilterService.activeFilters();
    this.applyAdvancedFilters(filters);
  });

  categories: Category[] = [];
  filteredCategories: Category[] = [];
  categoryTree: Category[] = [];
  stats: CategoryStats | null = null;
  
  // Granular loading states
  isCategoriesLoading = false;
  isStatsLoading = false;
  isTreeLoading = false;
  isFiltering = false;
  isDeleting = false;
  isExporting = false;
  
  error: string | null = null;
  
  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 0;
  
  // Filtering
  searchTerm = '';
  selectedLevel: number | '' = '';
  showActiveOnly = true;
  showSystemCategories = false;
  
  // Sorting
  sortBy = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';
  private previousSortBy = 'name';
  
  // View modes
  viewMode: 'list' | 'tree' | 'grid' = 'list';
  
  // Category levels for filter dropdown
  categoryLevels = [0, 1, 2, 3, 4, 5];

  // Advanced filter configuration
  filterFields: FilterField[] = [
    {
      key: 'name',
      label: 'Category Name',
      type: 'text',
      operators: ['contains', 'equals', 'startsWith', 'endsWith']
    },
    {
      key: 'level',
      label: 'Category Level',
      type: 'select',
      operators: ['equals', 'in'],
      options: [
        { value: 0, label: 'Root (0)' },
        { value: 1, label: 'Level 1' },
        { value: 2, label: 'Level 2' },
        { value: 3, label: 'Level 3' },
        { value: 4, label: 'Level 4' },
        { value: 5, label: 'Level 5' }
      ]
    },
    {
      key: 'isActive',
      label: 'Status',
      type: 'select',
      operators: ['equals'],
      options: [
        { value: true, label: 'Active' },
        { value: false, label: 'Inactive' }
      ]
    },
    {
      key: 'isSystem',
      label: 'Type',
      type: 'select',
      operators: ['equals'],
      options: [
        { value: true, label: 'System Category' },
        { value: false, label: 'Custom Category' }
      ]
    },
    {
      key: 'color',
      label: 'Color',
      type: 'text',
      operators: ['contains', 'equals']
    },
    {
      key: 'createdAt',
      label: 'Created Date',
      type: 'date',
      operators: ['equals', 'after', 'before', 'between']
    },
    {
      key: 'updatedAt',
      label: 'Updated Date',
      type: 'date',
      operators: ['equals', 'after', 'before', 'between']
    }
  ];

  ngOnInit(): void {
    this.loadCategories();
    this.loadCategoryStats();
    this.loadCategoryTree();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCategories(): void {
    this.isCategoriesLoading = true;
    this.error = null;

    const options: QueryOptions & {
      level?: number;
      isActive?: boolean;
      isSystem?: boolean;
    } = {
      page: this.currentPage,
      limit: this.pageSize,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      search: this.searchTerm || undefined,
      level: this.selectedLevel || undefined,
      isActive: this.showActiveOnly ? true : undefined,
      isSystem: this.showSystemCategories ? true : undefined
    };

    this.categoryService.getUserCategories(options)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
          this.filteredCategories = [...categories]; // Initialize filtered categories
          this.totalItems = categories.length; // Assuming no pagination from service
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          this.isCategoriesLoading = false;
        },
        error: (error) => {
          this.error = 'Failed to load categories';
          this.isCategoriesLoading = false;
          console.error('Error loading categories:', error);
        }
      });
  }

  private loadCategoryStats(): void {
    this.isStatsLoading = true;
    
    this.categoryService.getCategoryStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
          this.isStatsLoading = false;
        },
        error: (error) => {
          console.error('Error loading category stats:', error);
          this.error = 'Failed to load category statistics';
          this.isStatsLoading = false;
        }
      });
  }

  private loadCategoryTree(): void {
    this.isTreeLoading = true;
    
    this.categoryService.getCategoryTree()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tree) => {
          this.categoryTree = tree;
          this.isTreeLoading = false;
        },
        error: (error) => {
          console.error('Error loading category tree:', error);
          this.error = 'Failed to load category tree';
          this.isTreeLoading = false;
        }
      });
  }

  onSearch(): void {
    this.isFiltering = true;
    this.currentPage = 1; // Reset to first page when searching
    
    // Simulate a small delay to show loading state
    setTimeout(() => {
      this.loadCategories();
      this.isFiltering = false;
    }, 300);
  }

  onFilterChange(): void {
    this.onSearch();
  }

  onSortChange(newSortBy?: string): void {
    if (newSortBy && newSortBy !== this.sortBy) {
      // Different column - reset to asc
      this.sortBy = newSortBy;
      this.sortOrder = 'asc';
    } else if (newSortBy === undefined) {
      // No parameter - check if sortBy was changed externally
      if (this.sortBy !== this.previousSortBy) {
        // sortBy was changed externally - reset to asc
        this.sortOrder = 'asc';
        this.previousSortBy = this.sortBy;
      } else {
        // Same column - toggle sort order
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      }
    } else {
      // Same column - toggle sort order
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    }
    this.loadCategories();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadCategories();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.currentPage = 1;
    this.loadCategories();
  }

  onViewModeChange(mode: 'list' | 'tree' | 'grid'): void {
    this.viewMode = mode;
  }

  deleteCategory(categoryId: string): void {
    if (confirm('Are you sure you want to delete this category? This will also delete all subcategories and affect existing transactions.')) {
      this.isDeleting = true;
      
      this.categoryService.deleteCategory(categoryId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Remove from local arrays
            this.categories = this.categories.filter(c => c._id !== categoryId);
            this.totalItems--;
            this.totalPages = Math.ceil(this.totalItems / this.pageSize);
            
            // Reload tree and stats
            this.loadCategoryTree();
            this.loadCategoryStats();
            
            // If current page is now empty and not the first page, go to previous page
            if (this.categories.length === 0 && this.currentPage > 1) {
              this.currentPage--;
            }
            
            this.isDeleting = false;
          },
          error: (error) => {
            this.error = 'Failed to delete category';
            this.isDeleting = false;
            console.error('Error deleting category:', error);
          }
        });
    }
  }

  exportCategories(): void {
    this.isExporting = true;
    
    // Simulate export process
    setTimeout(() => {
      // This would trigger actual export logic
      console.log('Exporting categories...');
      this.isExporting = false;
    }, 2000);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedLevel = '';
    this.showActiveOnly = true;
    this.showSystemCategories = false;
    this.currentPage = 1;
    this.onSearch();
  }

  // Advanced filter methods

  private applyAdvancedFilters(filterGroups: FilterGroup[]): void {
    if (!filterGroups || filterGroups.length === 0) {
      this.filteredCategories = [...this.categories];
      return;
    }

    // Build query from filter groups
    const query = this.buildQueryFromFilterGroups(filterGroups);
    
    // Apply filters to categories
    this.filteredCategories = this.categories.filter(category => 
      this.evaluateCategoryAgainstQuery(category, query)
    );
  }

  private buildQueryFromFilterGroups(filterGroups: FilterGroup[]): any {
    const conditions: any[] = [];
    
    filterGroups.forEach(group => {
      if (group.conditions && group.conditions.length > 0) {
        const groupConditions = group.conditions.map(condition => ({
          field: condition.field,
          operator: condition.operator,
          value: condition.value
        }));
        
        if (group.logic === 'OR') {
          conditions.push({ $or: groupConditions });
        } else {
          conditions.push(...groupConditions);
        }
      }
    });
    
    return conditions.length > 0 ? { $and: conditions } : {};
  }

  private evaluateCategoryAgainstQuery(category: Category, query: any): boolean {
    if (!query || Object.keys(query).length === 0) {
      return true;
    }

    if (query.$and) {
      return query.$and.every((condition: any) => 
        this.evaluateFieldCondition(category, condition)
      );
    }

    if (query.$or) {
      return query.$or.some((condition: any) => 
        this.evaluateFieldCondition(category, condition)
      );
    }

    return this.evaluateFieldCondition(category, query);
  }

  private evaluateFieldCondition(category: Category, condition: any): boolean {
    const fieldValue = this.getCategoryFieldValue(category, condition.field);
    return this.evaluateOperator(fieldValue, condition.operator, condition.value);
  }

  private evaluateOperator(fieldValue: any, operator: string, conditionValue: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === conditionValue;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      case 'startsWith':
        return String(fieldValue).toLowerCase().startsWith(String(conditionValue).toLowerCase());
      case 'endsWith':
        return String(fieldValue).toLowerCase().endsWith(String(conditionValue).toLowerCase());
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
      case 'after':
        return new Date(fieldValue) > new Date(conditionValue);
      case 'before':
        return new Date(fieldValue) < new Date(conditionValue);
      case 'between':
        if (Array.isArray(conditionValue) && conditionValue.length === 2) {
          const [start, end] = conditionValue;
          return new Date(fieldValue) >= new Date(start) && new Date(fieldValue) <= new Date(end);
        }
        return false;
      default:
        return true;
    }
  }

  private getCategoryFieldValue(category: Category, field: string): any {
    switch (field) {
      case 'name':
        return category.name;
      case 'level':
        return category.level;
      case 'isActive':
        return category.isActive;
      case 'isSystem':
        return category.isSystem;
      case 'color':
        return category.color;
      case 'createdAt':
        return category.createdAt;
      case 'updatedAt':
        return category.updatedAt;
      default:
        return '';
    }
  }

  // Event handlers for advanced filter component
  onAdvancedFiltersChanged(filterGroups: FilterGroup[]): void {
    this.advancedFilterService.updateFilters(filterGroups);
  }

  onAdvancedSearchQuery(query: string): void {
    this.searchTerm = query;
    this.onSearch();
  }

  onPresetApplied(preset: any): void {
    console.log('Preset applied:', preset);
    // Handle preset application
  }

  onSavedFilterLoaded(filter: any): void {
    console.log('Saved filter loaded:', filter);
    // Handle saved filter loading
  }

  addToSearchHistory(query: string): void {
    // Add to search history if needed
    console.log('Adding to search history:', query);
  }

  // Helper methods
  getCategoryIcon(category: Category): string {
    if (category.icon) {
      // If it's already a FontAwesome class, return it
      if (category.icon.startsWith('fa-')) {
        return category.icon;
      }
      // If it's an emoji or other format, convert to FontAwesome
      return this.convertToFontAwesome(category.icon);
    }
    
    // Default icons based on category type or level
    switch (category.level) {
      case 0: return 'fa-home'; // Root categories
      case 1: return 'fa-folder'; // Main categories
      case 2: return '��'; // Subcategories
      default: return 'fa-file-alt'; // Deep subcategories
    }
  }

  getCategoryLevelClass(level: number): string {
    return `level-${level}`;
  }

  private convertToFontAwesome(icon: string): string {
    // Map common emoji icons to FontAwesome classes
    const iconMap: { [key: string]: string } = {
      '🏠': 'fa-home',
      '📁': 'fa-folder',
      '📄': 'fa-file',
      '💰': 'fa-money-bill',
      '🛒': 'fa-shopping-cart',
      '🍕': 'fa-utensils',
      '🚗': 'fa-car',
      '🏥': 'fa-hospital',
      '💼': 'fa-briefcase',
      '🎓': 'fa-graduation-cap',
      '💡': 'fa-lightbulb',
      '🔧': 'fa-tools',
      '📱': 'fa-mobile-alt',
      '💻': 'fa-laptop',
      '🎮': 'fa-gamepad',
      '🏃': 'fa-running',
      '🎵': 'fa-music',
      '📚': 'fa-book',
      '✈️': 'fa-plane',
      '🏨': 'fa-bed',
      '🍔': 'fa-hamburger'
    };
    
    return iconMap[icon] || 'fa-tag';
  }

  getCategoryStatusClass(category: Category): string {
    if (!category.isActive) return 'inactive';
    if (category.isSystem) return 'system';
    return 'active';
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatPercentage(value: number, total: number): string {
    if (total === 0) return '0%';
    const percentage = (value / total) * 100;
    return `${percentage.toFixed(1)}%`;
  }

  // Computed properties for loading states
  get isLoading(): boolean {
    return this.isCategoriesLoading || this.isStatsLoading || this.isTreeLoading;
  }

  get isAnyActionLoading(): boolean {
    return this.isFiltering || this.isDeleting || this.isExporting;
  }

  get hasCategories(): boolean {
    return this.categories.length > 0;
  }

  get hasStats(): boolean {
    return this.stats !== null;
  }

  get hasTree(): boolean {
    return this.categoryTree.length > 0;
  }

  get showPagination(): boolean {
    return this.totalPages > 1;
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
      const end = Math.min(this.totalPages, start + maxVisiblePages - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  // Pagination helper methods
  getPaginationStart(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getPaginationEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  // Tree view helper methods
  getRootCategories(): Category[] {
    return this.categoryTree.filter(cat => cat.level === 0);
  }

  getSubcategories(parentId: string): Category[] {
    return this.categoryTree.filter(cat => cat.parentId === parentId);
  }

  hasSubcategories(categoryId: string): boolean {
    return this.categoryTree.some(cat => cat.parentId === categoryId);
  }

  // Stats helper methods
  getTotalCategories(): number {
    return this.stats?.totalCategories || 0;
  }

  getActiveCategories(): number {
    return this.stats?.activeCategories || 0;
  }

  getTopLevelCategories(): number {
    return this.stats?.categoriesByLevel?.[0] || 0;
  }

  getTopCategories(): any[] {
    return this.stats?.topCategories || [];
  }

    // Additional methods needed for the updated template
    getTotalCategoriesCount(): number {
      return this.stats?.totalCategories || 0;
    }
  
    getActiveCategoriesCount(): number {
      return this.stats?.activeCategories || 0;
    }
  
    getCategoryColor(category: Category): string {
      return category.color || '#667eea';
    }
  
    getCategoryPath(category: Category): string {
      if (category.path && Array.isArray(category.path) && category.path.length > 0) {
        return category.path.join(' > ') + ' > ' + category.name;
      }
      return category.name;
    }
  
    getCategoryTypeClass(isSystem: boolean): string {
      return isSystem ? 'type-system' : 'type-custom';
    }
  
    formatDate(date: Date): string {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  
    // Tree view helper methods
      getChildCategories(parentId?: string): Category[] {
    if (!parentId) {
      // Return all categories when no parentId is provided
      return this.categories;
    }
    return this.categories.filter(cat => cat.parentId === parentId);
  }
  
    hasChildren(categoryId: string): boolean {
      return this.categories.some(cat => cat.parentId === categoryId);
    }
  
    getCategoryLevelIndent(level: number): string {
      return `${level * 20}px`;
    }
  
    toggleCategoryExpansion(categoryId: string): void {
      // This would implement expand/collapse functionality
      console.log('Toggle expansion for category:', categoryId);
    }
  
    // Grid view helper methods
    getGridCategories(): Category[][] {
      const itemsPerRow = 3;
      const rows: Category[][] = [];
      
      for (let i = 0; i < this.categories.length; i += itemsPerRow) {
        rows.push(this.categories.slice(i, i + itemsPerRow));
      }
      
      return rows;
    }
  
    // Category management methods
    onCategoryToggleActive(categoryId: string, currentStatus: boolean): void {
      this.isDeleting = true; // Reuse loading state
      
      this.categoryService.updateCategory(categoryId, { isActive: !currentStatus })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Update local state
            const category = this.categories.find(c => c._id === categoryId);
            if (category) {
              category.isActive = !currentStatus;
            }
            this.isDeleting = false;
          },
          error: (error) => {
            this.error = 'Failed to update category status';
            this.isDeleting = false;
            console.error('Error updating category status:', error);
          }
        });
    }
  
    onCategoryDelete(categoryId: string): void {
      if (confirm('Are you sure you want to delete this category? This will also delete all subcategories and affect existing transactions.')) {
        this.isDeleting = true;
        
        this.categoryService.deleteCategory(categoryId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              // Remove from local arrays
              this.categories = this.categories.filter(c => c._id !== categoryId);
              this.totalItems--;
              this.totalPages = Math.ceil(this.totalItems / this.pageSize);
              
              // Reload tree and stats
              this.loadCategoryTree();
              this.loadCategoryStats();
              
              // If current page is now empty and not the first page, go to previous page
              if (this.categories.length === 0 && this.currentPage > 1) {
                this.currentPage--;
              }
              
              this.isDeleting = false;
            },
            error: (error) => {
              this.error = 'Failed to delete category';
              this.isDeleting = false;
              console.error('Error deleting category:', error);
            }
          });
      }
    }
}