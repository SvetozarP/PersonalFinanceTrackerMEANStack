import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, switchMap, of } from 'rxjs';
import { Category, CategoryStats, QueryOptions } from '../../../../core/models/financial.model';
import { CategoryService } from '../../../../core/services/category.service';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './category-list.html',
  styleUrls: ['./category-list.scss']
})
export class CategoryListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private categoryService = inject(CategoryService);

  categories: Category[] = [];
  categoryTree: Category[] = [];
  stats: CategoryStats | null = null;
  isLoading = false;
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
  
  // View modes
  viewMode: 'list' | 'tree' | 'grid' = 'list';
  
  // Category levels for filter dropdown
  categoryLevels = [0, 1, 2, 3, 4, 5];

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
    this.isLoading = true;
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
          this.totalItems = categories.length; // Assuming no pagination from service
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Failed to load categories';
          this.isLoading = false;
          console.error('Error loading categories:', error);
        }
      });
  }

  private loadCategoryStats(): void {
    this.categoryService.getCategoryStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
        },
        error: (error) => {
          console.error('Error loading category stats:', error);
        }
      });
  }

  private loadCategoryTree(): void {
    this.categoryService.getCategoryTree()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tree) => {
          this.categoryTree = tree;
        },
        error: (error) => {
          console.error('Error loading category tree:', error);
        }
      });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadCategories();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadCategories();
  }

  onSort(column: string): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'asc';
    }
    this.loadCategories();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadCategories();
  }

  onViewModeChange(mode: 'list' | 'tree' | 'grid'): void {
    this.viewMode = mode;
  }

  onCategoryDelete(categoryId: string): void {
    if (confirm('Are you sure you want to delete this category? This will also affect all subcategories and transactions.')) {
      this.categoryService.deleteCategory(categoryId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadCategories();
            this.loadCategoryTree();
            this.loadCategoryStats();
          },
          error: (error) => {
            console.error('Error deleting category:', error);
            this.error = 'Failed to delete category';
          }
        });
    }
  }

  onCategoryToggleActive(categoryId: string, currentStatus: boolean): void {
    this.categoryService.updateCategory(categoryId, { isActive: !currentStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadCategories();
          this.loadCategoryStats();
        },
        error: (error) => {
          console.error('Error updating category status:', error);
          this.error = 'Failed to update category status';
        }
      });
  }

  // Pagination helper methods
  getPaginationStart(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getPaginationEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  // Helper methods for template
  getCategoryIcon(category: Category): string {
    if (category.icon) return category.icon;
    
    // Default icons based on category level or name
    if (category.level === 0) return '��';
    if (category.level === 1) return '��';
    if (category.level === 2) return '📋';
    return '🏷️';
  }

  getCategoryColor(category: Category): string {
    if (category.color) return category.color;
    
    // Default colors based on level
    const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
    return colors[category.level % colors.length];
  }

  getCategoryPath(category: Category): string {
    if (!category.path || category.path.length === 0) return category.name;
    return category.path.join(' > ') + ' > ' + category.name;
  }

  getCategoryLevelIndent(level: number): string {
    return `${level * 20}px`;
  }

  getCategoryStatusClass(isActive: boolean): string {
    return isActive ? 'status-active' : 'status-inactive';
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

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedLevel = '';
    this.showActiveOnly = true;
    this.showSystemCategories = false;
    this.currentPage = 1;
    this.loadCategories();
  }

  // Tree view methods
  getChildCategories(parentId?: string): Category[] {
    if (!parentId) {
      return this.categoryTree.filter(cat => !cat.parentId);
    }
    return this.categoryTree.filter(cat => cat.parentId === parentId);
  }

  hasChildren(categoryId: string): boolean {
    return this.categoryTree.some(cat => cat.parentId === categoryId);
  }

  toggleCategoryExpansion(categoryId: string): void {
    // This would be implemented with a separate expansion state tracking
    // For now, we'll show all categories
  }

  // Grid view methods
  getGridCategories(): Category[][] {
    const grid: Category[][] = [];
    const itemsPerRow = 3;
    
    for (let i = 0; i < this.categories.length; i += itemsPerRow) {
      grid.push(this.categories.slice(i, i + itemsPerRow));
    }
    
    return grid;
  }

  // Stats helper methods
  getActiveCategoriesCount(): number {
    return this.stats?.activeCategories || 0;
  }

  getTotalCategoriesCount(): number {
    return this.stats?.totalCategories || 0;
  }

  getTopCategories(): any[] {
    return this.stats?.topCategories || [];
  }
}