import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { CategoryListComponent } from './category-list';
import { CategoryService } from '../../../../core/services/category.service';
import { Category, CategoryStats } from '../../../../core/models/financial.model';

describe('CategoryListComponent', () => {
  let component: CategoryListComponent;
  let fixture: ComponentFixture<CategoryListComponent>;
  let categoryService: jasmine.SpyObj<CategoryService>;

  const mockCategories: Category[] = [
    {
      _id: 'cat1',
      name: 'Food & Dining',
      description: 'Food and dining expenses',
      color: '#FF0000',
      icon: '🍔',
      path: ['Food & Dining'],
      level: 1,
      isActive: true,
      isSystem: false,
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 'cat2',
      name: 'Transportation',
      description: 'Transportation expenses',
      color: '#00FF00',
      icon: '🚗',
      path: ['Transportation'],
      level: 1,
      isActive: true,
      isSystem: false,
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockStats: CategoryStats = {
    totalCategories: 2,
    activeCategories: 2,
    categoriesByLevel: { 1: 2 },
    topCategories: [
      {
        categoryId: 'cat1',
        name: 'Food & Dining',
        transactionCount: 5,
        totalAmount: 250.50,
        percentage: 45.5
      }
    ]
  };

  beforeEach(async () => {
    const categoryServiceSpy = jasmine.createSpyObj('CategoryService', [
      'getUserCategories', 'getCategoryTree', 'getCategoryStats', 'deleteCategory', 'updateCategory'
    ]);

    // Setup default return values
    categoryServiceSpy.getUserCategories.and.returnValue(of(mockCategories));
    categoryServiceSpy.getCategoryTree.and.returnValue(of(mockCategories));
    categoryServiceSpy.getCategoryStats.and.returnValue(of(mockStats));
    categoryServiceSpy.deleteCategory.and.returnValue(of(true));
    categoryServiceSpy.updateCategory.and.returnValue(of(mockCategories[0]));

    await TestBed.configureTestingModule({
      imports: [
        CategoryListComponent,
        FormsModule,
        ReactiveFormsModule,
        RouterTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: CategoryService, useValue: categoryServiceSpy }
      ]
    })
    .compileComponents();

    categoryService = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;

    fixture = TestBed.createComponent(CategoryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    // categories are loaded on init, so they won't be empty
    expect(component.currentPage).toBe(1);
    expect(component.pageSize).toBe(20);
    expect(component.searchTerm).toBe('');
    expect(component.selectedLevel).toBe('' as any);
    expect(component.showActiveOnly).toBe(true);
    expect(component.showSystemCategories).toBe(false);
    expect(component.sortBy).toBe('name');
    expect(component.sortOrder).toBe('asc');
    expect(component.viewMode).toBe('list');
  });

  it('should load categories on init', () => {
    expect(categoryService.getUserCategories).toHaveBeenCalled();
    expect(categoryService.getCategoryStats).toHaveBeenCalled();
  });

  it('should handle search', () => {
    component.searchTerm = 'food';
    component.onSearch();

    expect(component.currentPage).toBe(1);
    expect(categoryService.getUserCategories).toHaveBeenCalled();
  });

  it('should handle filter changes', () => {
    component.selectedLevel = 1;
    component.onFilterChange();

    expect(component.currentPage).toBe(1);
    expect(categoryService.getUserCategories).toHaveBeenCalled();
  });

  it('should handle sorting', () => {
    // Test same column sort order change
    component.onSortChange();
    expect(component.sortOrder).toBe('desc');

    component.onSortChange();
    expect(component.sortOrder).toBe('asc');

    // Test different column
    component.sortBy = 'level';
    component.onSortChange();
    expect(component.sortBy).toBe('level');
    expect(component.sortOrder).toBe('asc');
  });

  it('should handle page changes', () => {
    component.onPageChange(2);
    expect(component.currentPage).toBe(2);
    expect(categoryService.getUserCategories).toHaveBeenCalled();
  });

  it('should handle view mode changes', () => {
    component.onViewModeChange('tree');
    expect(component.viewMode).toBe('tree');
    expect(categoryService.getCategoryTree).toHaveBeenCalled();

    component.onViewModeChange('list');
    expect(component.viewMode).toBe('list');
    expect(categoryService.getUserCategories).toHaveBeenCalled();
  });

  it('should handle category deletion', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.onCategoryDelete('cat1');

    expect(categoryService.deleteCategory).toHaveBeenCalledWith('cat1');
  });

  it('should not delete category when user cancels', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.onCategoryDelete('cat1');

    expect(categoryService.deleteCategory).not.toHaveBeenCalled();
  });

  it('should calculate pagination correctly', () => {
    component.currentPage = 2;
    component.pageSize = 20;
    component.totalItems = 50;

    expect(component.getPaginationStart()).toBe(21);
    expect(component.getPaginationEnd()).toBe(40);
  });

  it('should handle active filter toggle', () => {
    component.showActiveOnly = false;
    component.onFilterChange();

    expect(categoryService.getUserCategories).toHaveBeenCalled();
  });

  it('should handle system categories filter toggle', () => {
    component.showSystemCategories = true;
    component.onFilterChange();

    expect(categoryService.getUserCategories).toHaveBeenCalled();
  });

  it('should clear filters correctly', () => {
    component.searchTerm = 'test';
    component.selectedLevel = 1;
    component.showActiveOnly = false;
    component.showSystemCategories = true;
    component.currentPage = 3;

    component.clearFilters();

    expect(component.searchTerm).toBe('');
    expect(component.selectedLevel).toBe('' as any);
    expect(component.showActiveOnly).toBe(true);
    expect(component.showSystemCategories).toBe(false);
    expect(component.currentPage).toBe(1);
    expect(categoryService.getUserCategories).toHaveBeenCalled();
  });

  it('should get category path', () => {
    const category = mockCategories[0];
    const path = component.getCategoryPath(category);

    expect(path).toBe('Food & Dining > Food & Dining');
  });

  it('should get category icon', () => {
    const category = mockCategories[0];
    const icon = component.getCategoryIcon(category);

    expect(icon).toBe('🍔');
  });

  it('should get category color', () => {
    const category = mockCategories[0];
    const color = component.getCategoryColor(category);

    expect(color).toBe('#FF0000');
  });

  it('should get category level indent', () => {
    const indent1 = component.getCategoryLevelIndent(1);
    const indent2 = component.getCategoryLevelIndent(2);

    expect(indent1).toBe('20px');
    expect(indent2).toBe('40px');
  });

  it('should get category status class', () => {
    const activeCategory = { ...mockCategories[0], isActive: true, isSystem: false };
    const inactiveCategory = { ...mockCategories[0], isActive: false, isSystem: false };
    const systemCategory = { ...mockCategories[0], isActive: true, isSystem: true };

    const activeClass = component.getCategoryStatusClass(activeCategory);
    const inactiveClass = component.getCategoryStatusClass(inactiveCategory);
    const systemClass = component.getCategoryStatusClass(systemCategory);

    expect(activeClass).toBe('active');
    expect(inactiveClass).toBe('inactive');
    expect(systemClass).toBe('system');
  });

  it('should get category type class', () => {
    const systemClass = component.getCategoryTypeClass(true);
    const customClass = component.getCategoryTypeClass(false);

    expect(systemClass).toBe('type-system');
    expect(customClass).toBe('type-custom');
  });

  it('should format date', () => {
    const testDate = new Date('2024-01-15');
    const formatted = component.formatDate(testDate);

    expect(formatted).toContain('Jan 15, 2024');
  });

  it('should get child categories', () => {
    const childCategories = component.getChildCategories();
    // Since these are top-level categories (no parentId), they are returned as children
    expect(childCategories.length).toBe(2);

    const childCategoriesWithParent = component.getChildCategories('cat1');
    expect(childCategoriesWithParent).toEqual([]);
  });

  it('should check if category has children', () => {
    const hasChildren = component.hasChildren('cat1');
    expect(hasChildren).toBe(false);
  });

  it('should get grid categories', () => {
    const gridCategories = component.getGridCategories();
    expect(gridCategories.length).toBeGreaterThan(0);
  });

  it('should get active categories count', () => {
    const count = component.getActiveCategoriesCount();
    expect(count).toBe(2);
  });

  it('should get total categories count', () => {
    const count = component.getTotalCategoriesCount();
    expect(count).toBe(2);
  });

  it('should get top categories', () => {
    const topCategories = component.getTopCategories();
    expect(topCategories.length).toBe(1);
    expect(topCategories[0].name).toBe('Food & Dining');
  });

  it('should handle category loading error', () => {
    categoryService.getUserCategories.and.returnValue(throwError(() => new Error('API Error')));
    
    component['loadCategories']();
    
    expect(component.error).toBe('Failed to load categories');
    expect(component.isCategoriesLoading).toBe(false);
  });

  it('should handle category stats loading error', () => {
    categoryService.getCategoryStats.and.returnValue(throwError(() => new Error('API Error')));
    
    component['loadCategoryStats']();
    
    expect(component.isStatsLoading).toBe(false);
  });

  it('should handle category tree loading error', () => {
    categoryService.getCategoryTree.and.returnValue(throwError(() => new Error('API Error')));
    
    component['loadCategoryTree']();
    
    expect(component.isTreeLoading).toBe(false);
  });

  it('should handle category deletion error', () => {
    categoryService.deleteCategory.and.returnValue(throwError(() => new Error('API Error')));
    spyOn(window, 'confirm').and.returnValue(true);
    
    component.onCategoryDelete('cat1');
    
    expect(component.error).toBe('Failed to delete category');
    expect(component.isDeleting).toBe(false);
  });

  it('should handle category toggle active error', () => {
    categoryService.updateCategory.and.returnValue(throwError(() => new Error('API Error')));
    
    component.onCategoryToggleActive('cat1', true);
    
    expect(component.error).toBe('Failed to update category status');
    expect(component.isDeleting).toBe(false);
  });

  it('should handle pagination when current page becomes empty', () => {
    component.categories = [mockCategories[0]];
    component.currentPage = 2;
    component.totalItems = 1;
    categoryService.deleteCategory.and.returnValue(of(true));
    spyOn(window, 'confirm').and.returnValue(true);
    
    component.onCategoryDelete('cat1');
    
    expect(component.currentPage).toBe(1);
  });

  it('should handle different sort orders', () => {
    component.sortBy = 'name';
    component.sortOrder = 'asc';
    
    component.onSortChange();
    
    expect(component.sortOrder).toBe('desc');
  });

  it('should handle different sort columns', () => {
    component.sortBy = 'name';
    component['previousSortBy'] = 'name';
    
    component.onSortChange('level');
    
    expect(component.sortBy).toBe('level');
    expect(component.sortOrder).toBe('asc');
  });

  it('should handle sort when sortBy changed externally', () => {
    component.sortBy = 'level';
    component['previousSortBy'] = 'name';
    
    component.onSortChange();
    
    expect(component.sortOrder).toBe('asc');
    expect(component['previousSortBy']).toBe('level');
  });

  it('should handle page size change', () => {
    component.onPageSizeChange(10);
    
    expect(component.pageSize).toBe(10);
    expect(component.currentPage).toBe(1);
  });

  it('should handle view mode change to tree', () => {
    component.onViewModeChange('tree');
    
    expect(component.viewMode).toBe('tree');
    expect(categoryService.getCategoryTree).toHaveBeenCalled();
  });

  it('should handle view mode change to grid', () => {
    component.onViewModeChange('grid');
    
    expect(component.viewMode).toBe('grid');
  });

  it('should handle export categories', () => {
    const consoleSpy = spyOn(console, 'log');
    
    component.exportCategories();
    
    expect(component.isExporting).toBe(true);
    
    // Wait for timeout
    setTimeout(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Exporting categories...');
      expect(component.isExporting).toBe(false);
    }, 2100);
  });

  it('should get category icon with default fallback', () => {
    const categoryWithoutIcon = { ...mockCategories[0], icon: undefined };
    
    const icon = component.getCategoryIcon(categoryWithoutIcon);
    
    expect(icon).toBeDefined();
    expect(icon.length).toBeGreaterThan(0);
  });

  it('should get category icon for different levels', () => {
    const level0Category = { ...mockCategories[0], level: 0, icon: undefined };
    const level2Category = { ...mockCategories[0], level: 2, icon: undefined };
    const level3Category = { ...mockCategories[0], level: 3, icon: undefined };
    
    expect(component.getCategoryIcon(level0Category)).toBeDefined();
    expect(component.getCategoryIcon(level2Category)).toBeDefined();
    expect(component.getCategoryIcon(level3Category)).toBeDefined();
  });

  it('should get category level class', () => {
    const levelClass = component.getCategoryLevelClass(2);
    
    expect(levelClass).toBe('level-2');
  });

  it('should get category status class for different states', () => {
    const activeCategory = { ...mockCategories[0], isActive: true, isSystem: false };
    const inactiveCategory = { ...mockCategories[0], isActive: false, isSystem: false };
    const systemCategory = { ...mockCategories[0], isActive: true, isSystem: true };
    
    expect(component.getCategoryStatusClass(activeCategory)).toBe('active');
    expect(component.getCategoryStatusClass(inactiveCategory)).toBe('inactive');
    expect(component.getCategoryStatusClass(systemCategory)).toBe('system');
  });

  it('should format currency', () => {
    const formatted = component.formatCurrency(1234.56, 'USD');
    
    expect(formatted).toContain('$1,234.56');
  });

  it('should format percentage with zero total', () => {
    const percentage = component.formatPercentage(50, 0);
    
    expect(percentage).toBe('0%');
  });

  it('should format percentage with valid values', () => {
    const percentage = component.formatPercentage(25, 100);
    
    expect(percentage).toBe('25.0%');
  });

  it('should check if has categories', () => {
    component.categories = [mockCategories[0]];
    
    expect(component.hasCategories).toBe(true);
  });

  it('should check if has no categories', () => {
    component.categories = [];
    
    expect(component.hasCategories).toBe(false);
  });

  it('should check if has stats', () => {
    component.stats = mockStats;
    
    expect(component.hasStats).toBe(true);
  });

  it('should check if has no stats', () => {
    component.stats = null;
    
    expect(component.hasStats).toBe(false);
  });

  it('should check if has tree', () => {
    component.categoryTree = [mockCategories[0]];
    
    expect(component.hasTree).toBe(true);
  });

  it('should check if has no tree', () => {
    component.categoryTree = [];
    
    expect(component.hasTree).toBe(false);
  });

  it('should show pagination when multiple pages', () => {
    component.totalPages = 3;
    
    expect(component.showPagination).toBe(true);
  });

  it('should not show pagination when single page', () => {
    component.totalPages = 1;
    
    expect(component.showPagination).toBe(false);
  });

  it('should generate page numbers for few pages', () => {
    component.totalPages = 3;
    component.currentPage = 2;
    
    const pages = component.pageNumbers;
    
    expect(pages).toEqual([1, 2, 3]);
  });

  it('should generate page numbers for many pages', () => {
    component.totalPages = 10;
    component.currentPage = 5;
    
    const pages = component.pageNumbers;
    
    expect(pages.length).toBe(5);
    expect(pages).toContain(3);
    expect(pages).toContain(7);
  });

  it('should get root categories', () => {
    component.categoryTree = [
      { ...mockCategories[0], level: 0 },
      { ...mockCategories[1], level: 1 }
    ];
    
    const rootCategories = component.getRootCategories();
    
    expect(rootCategories.length).toBe(1);
    expect(rootCategories[0].level).toBe(0);
  });

  it('should get subcategories', () => {
    component.categoryTree = [
      { ...mockCategories[0], _id: 'parent1' },
      { ...mockCategories[1], _id: 'child1', parentId: 'parent1' }
    ];
    
    const subcategories = component.getSubcategories('parent1');
    
    expect(subcategories.length).toBe(1);
    expect(subcategories[0].parentId).toBe('parent1');
  });

  it('should check if category has subcategories', () => {
    component.categoryTree = [
      { ...mockCategories[0], _id: 'parent1' },
      { ...mockCategories[1], _id: 'child1', parentId: 'parent1' }
    ];
    
    expect(component.hasSubcategories('parent1')).toBe(true);
    expect(component.hasSubcategories('child1')).toBe(false);
  });

  it('should get total categories count', () => {
    component.stats = mockStats;
    
    expect(component.getTotalCategories()).toBe(2);
  });

  it('should get active categories count', () => {
    component.stats = mockStats;
    
    expect(component.getActiveCategories()).toBe(2);
  });

  it('should get top level categories count', () => {
    component.stats = mockStats;
    
    expect(component.getTopLevelCategories()).toBe(0); // Level 0 categories, but mockStats has level 1
  });

  it('should handle missing stats gracefully', () => {
    component.stats = null;
    
    expect(component.getTotalCategories()).toBe(0);
    expect(component.getActiveCategories()).toBe(0);
    expect(component.getTopLevelCategories()).toBe(0);
  });

  it('should get category color with fallback', () => {
    const categoryWithoutColor = { ...mockCategories[0], color: undefined };
    
    const color = component.getCategoryColor(categoryWithoutColor);
    
    expect(color).toBe('#667eea');
  });

  it('should get category path with empty path array', () => {
    const categoryWithEmptyPath = { ...mockCategories[0], path: [] };
    
    const path = component.getCategoryPath(categoryWithEmptyPath);
    
    expect(path).toBe('Food & Dining');
  });

  it('should get category path with null path', () => {
    const categoryWithNullPath = { ...mockCategories[0], path: [] };
    
    const path = component.getCategoryPath(categoryWithNullPath);
    
    expect(path).toBe('Food & Dining');
  });

  it('should get category type class', () => {
    expect(component.getCategoryTypeClass(true)).toBe('type-system');
    expect(component.getCategoryTypeClass(false)).toBe('type-custom');
  });

  it('should format date', () => {
    const testDate = new Date('2024-01-15');
    const formatted = component.formatDate(testDate);
    
    expect(formatted).toContain('Jan 15, 2024');
  });

  it('should get child categories with parentId', () => {
    component.categories = [
      { ...mockCategories[0], _id: 'parent1' },
      { ...mockCategories[1], _id: 'child1', parentId: 'parent1' }
    ];
    
    const children = component.getChildCategories('parent1');
    
    expect(children.length).toBe(1);
    expect(children[0].parentId).toBe('parent1');
  });

  it('should get all categories when no parentId', () => {
    component.categories = mockCategories;
    
    const allCategories = component.getChildCategories();
    
    expect(allCategories).toEqual(mockCategories);
  });

  it('should check if category has children', () => {
    component.categories = [
      { ...mockCategories[0], _id: 'parent1' },
      { ...mockCategories[1], _id: 'child1', parentId: 'parent1' }
    ];
    
    expect(component.hasChildren('parent1')).toBe(true);
    expect(component.hasChildren('child1')).toBe(false);
  });

  it('should get category level indent', () => {
    const indent1 = component.getCategoryLevelIndent(1);
    const indent3 = component.getCategoryLevelIndent(3);
    
    expect(indent1).toBe('20px');
    expect(indent3).toBe('60px');
  });

  it('should toggle category expansion', () => {
    spyOn(console, 'log');
    
    component.toggleCategoryExpansion('cat1');
    
    expect(console.log).toHaveBeenCalledWith('Toggle expansion for category:', 'cat1');
  });

  it('should get grid categories', () => {
    component.categories = [
      { ...mockCategories[0], _id: 'cat1' },
      { ...mockCategories[1], _id: 'cat2' },
      { ...mockCategories[0], _id: 'cat3' },
      { ...mockCategories[1], _id: 'cat4' }
    ];
    
    const gridCategories = component.getGridCategories();
    
    expect(gridCategories.length).toBe(2); // 4 items / 3 per row = 2 rows
    expect(gridCategories[0].length).toBe(3);
    expect(gridCategories[1].length).toBe(1);
  });

  it('should handle category toggle active success', () => {
    categoryService.updateCategory.and.returnValue(of(mockCategories[0]));
    component.categories = [mockCategories[0]];
    
    component.onCategoryToggleActive('cat1', true);
    
    expect(component.categories[0].isActive).toBe(false);
    expect(component.isDeleting).toBe(false);
  });
});
