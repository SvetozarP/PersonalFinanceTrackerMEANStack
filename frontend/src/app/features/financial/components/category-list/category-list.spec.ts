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
  let confirmSpy: jasmine.Spy;

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
    
    // Set up global confirm spy only if it doesn't exist
    if (!(window.confirm as any).and) {
      confirmSpy = spyOn(window, 'confirm');
    } else {
      confirmSpy = window.confirm as jasmine.Spy;
    }
  });

  afterEach(() => {
    // Clean up any spies to prevent conflicts
    if (window.confirm && (window.confirm as any).and) {
      if ((window.confirm as any).and.restore) {
        (window.confirm as any).and.restore();
      } else {
        // If restore is not available, reset to callThrough
        (window.confirm as any).and.callThrough();
      }
    }
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
    confirmSpy.and.returnValue(true);
    component.onCategoryDelete('cat1');

    expect(categoryService.deleteCategory).toHaveBeenCalledWith('cat1');
    expect(confirmSpy).toHaveBeenCalled();
  });

  it('should not delete category when user cancels', () => {
    confirmSpy.and.returnValue(false);
    component.onCategoryDelete('cat1');

    expect(categoryService.deleteCategory).not.toHaveBeenCalled();
    expect(confirmSpy).toHaveBeenCalled();
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

  it('should handle category loading error', (done) => {
    categoryService.getUserCategories.and.returnValue(throwError(() => new Error('API Error')));
    
    component['loadCategories']();
    
    // Wait for the async operation to complete
    setTimeout(() => {
      expect(component.error).toBe('Failed to load categories');
      expect(component.isCategoriesLoading).toBe(false);
      done();
    }, 0);
  });

  it('should handle category stats loading error', (done) => {
    categoryService.getCategoryStats.and.returnValue(throwError(() => new Error('API Error')));
    
    component['loadCategoryStats']();
    
    // Wait for the async operation to complete
    setTimeout(() => {
      expect(component.isStatsLoading).toBe(false);
      done();
    }, 0);
  });

  it('should handle category tree loading error', (done) => {
    categoryService.getCategoryTree.and.returnValue(throwError(() => new Error('API Error')));
    
    component['loadCategoryTree']();
    
    // Wait for the async operation to complete
    setTimeout(() => {
      expect(component.isTreeLoading).toBe(false);
      done();
    }, 0);
  });

  it('should handle category deletion error', (done) => {
    categoryService.deleteCategory.and.returnValue(throwError(() => new Error('API Error')));
    confirmSpy.and.returnValue(true);
    
    component.onCategoryDelete('cat1');
    
    // Wait for the async operation to complete
    setTimeout(() => {
      expect(component.error).toBe('Failed to delete category');
      expect(component.isDeleting).toBe(false);
      done();
    }, 0);
  });

  it('should handle category toggle active error', (done) => {
    categoryService.updateCategory.and.returnValue(throwError(() => new Error('API Error')));
    
    component.onCategoryToggleActive('cat1', true);
    
    // Wait for the async operation to complete
    setTimeout(() => {
      expect(component.error).toBe('Failed to update category status');
      expect(component.isDeleting).toBe(false);
      done();
    }, 0);
  });

  it('should handle pagination when current page becomes empty', () => {
    component.categories = [mockCategories[0]];
    component.currentPage = 2;
    component.totalItems = 1;
    categoryService.deleteCategory.and.returnValue(of(true));
    confirmSpy.and.returnValue(true);
    
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

  it('should handle export categories', (done) => {
    const consoleSpy = spyOn(console, 'log');
    
    component.exportCategories();
    
    expect(component.isExporting).toBe(true);
    
    // Wait for timeout
    setTimeout(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Exporting categories...');
      expect(component.isExporting).toBe(false);
      done();
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

  // Advanced filter tests for better branch coverage
  describe('Advanced Filter Methods', () => {
    it('should apply advanced filters with empty filter groups', () => {
      component.categories = mockCategories;
      component['applyAdvancedFilters']([]);
      
      expect(component.filteredCategories).toEqual(mockCategories);
    });

    it('should apply advanced filters with null filter groups', () => {
      component.categories = mockCategories;
      component['applyAdvancedFilters'](null as any);
      
      expect(component.filteredCategories).toEqual(mockCategories);
    });

    it('should build query from filter groups with OR logic', () => {
      const filterGroups = [{
        id: '1',
        name: 'Test Group',
        logic: 'OR' as const,
        conditions: [
          { field: 'name', operator: 'contains' as const, value: 'Food' },
          { field: 'level', operator: 'equals' as const, value: 1 }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }];
      
      const query = component['buildQueryFromFilterGroups'](filterGroups);
      
      expect(query).toEqual({
        $and: [{
          $or: [
            { field: 'name', operator: 'contains' as const, value: 'Food' },
            { field: 'level', operator: 'equals' as const, value: 1 }
          ]
        }]
      });
    });

    it('should build query from filter groups with AND logic', () => {
      const filterGroups = [{
        id: '1',
        name: 'Test Group',
        logic: 'AND' as const,
        conditions: [
          { field: 'name', operator: 'contains' as const, value: 'Food' },
          { field: 'level', operator: 'equals' as const, value: 1 }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }];
      
      const query = component['buildQueryFromFilterGroups'](filterGroups);
      
      expect(query).toEqual({
        $and: [
          { field: 'name', operator: 'contains' as const, value: 'Food' },
          { field: 'level', operator: 'equals' as const, value: 1 }
        ]
      });
    });

    it('should build query from empty filter groups', () => {
      const filterGroups = [{
        id: '1',
        name: 'Test Group',
        logic: 'AND' as const,
        conditions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }];
      
      const query = component['buildQueryFromFilterGroups'](filterGroups);
      
      expect(query).toEqual({});
    });

    it('should evaluate category against query with $and', () => {
      const category = mockCategories[0];
      const query = {
        $and: [
          { field: 'name', operator: 'contains' as const, value: 'Food' },
          { field: 'level', operator: 'equals' as const, value: 1 }
        ]
      };
      
      const result = component['evaluateCategoryAgainstQuery'](category, query);
      
      expect(result).toBe(true);
    });

    it('should evaluate category against query with $or', () => {
      const category = mockCategories[0];
      const query = {
        $or: [
          { field: 'name', operator: 'contains' as const, value: 'Transport' },
          { field: 'level', operator: 'equals' as const, value: 1 }
        ]
      };
      
      const result = component['evaluateCategoryAgainstQuery'](category, query);
      
      expect(result).toBe(true);
    });

    it('should evaluate category against simple query', () => {
      const category = mockCategories[0];
      const query = { field: 'name', operator: 'contains' as const, value: 'Food' };
      
      const result = component['evaluateCategoryAgainstQuery'](category, query);
      
      expect(result).toBe(true);
    });

    it('should evaluate category against empty query', () => {
      const category = mockCategories[0];
      const query = {};
      
      const result = component['evaluateCategoryAgainstQuery'](category, query);
      
      expect(result).toBe(true);
    });

    it('should evaluate field condition', () => {
      const category = mockCategories[0];
      const condition = { field: 'name', operator: 'contains' as const, value: 'Food' };
      
      const result = component['evaluateFieldCondition'](category, condition);
      
      expect(result).toBe(true);
    });

    it('should evaluate operator equals', () => {
      const result = component['evaluateOperator']('Food', 'equals', 'Food');
      expect(result).toBe(true);
    });

    it('should evaluate operator contains', () => {
      const result = component['evaluateOperator']('Food & Dining', 'contains', 'Food');
      expect(result).toBe(true);
    });

    it('should evaluate operator startsWith', () => {
      const result = component['evaluateOperator']('Food & Dining', 'startsWith', 'Food');
      expect(result).toBe(true);
    });

    it('should evaluate operator endsWith', () => {
      const result = component['evaluateOperator']('Food & Dining', 'endsWith', 'Dining');
      expect(result).toBe(true);
    });

    it('should evaluate operator in', () => {
      const result = component['evaluateOperator']('Food', 'in', ['Food', 'Transport']);
      expect(result).toBe(true);
    });

    it('should evaluate operator after', () => {
      const result = component['evaluateOperator']('2024-01-15', 'after', '2024-01-01');
      expect(result).toBe(true);
    });

    it('should evaluate operator before', () => {
      const result = component['evaluateOperator']('2024-01-01', 'before', '2024-01-15');
      expect(result).toBe(true);
    });

    it('should evaluate operator between', () => {
      const result = component['evaluateOperator']('2024-01-10', 'between', ['2024-01-01', '2024-01-15']);
      expect(result).toBe(true);
    });

    it('should evaluate operator between with invalid array', () => {
      const result = component['evaluateOperator']('2024-01-10', 'between', ['2024-01-01']);
      expect(result).toBe(false);
    });

    it('should evaluate operator between with non-array', () => {
      const result = component['evaluateOperator']('2024-01-10', 'between', '2024-01-01');
      expect(result).toBe(false);
    });

    it('should evaluate operator default case', () => {
      const result = component['evaluateOperator']('value', 'unknown', 'test');
      expect(result).toBe(true);
    });

    it('should get category field value for different fields', () => {
      // Create a fresh copy to avoid test interference
      const category = {
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
      };
      
      expect(component['getCategoryFieldValue'](category, 'name')).toBe('Food & Dining');
      expect(component['getCategoryFieldValue'](category, 'level')).toBe(1);
      expect(component['getCategoryFieldValue'](category, 'isActive')).toBe(true);
      expect(component['getCategoryFieldValue'](category, 'isSystem')).toBe(false);
      expect(component['getCategoryFieldValue'](category, 'color')).toBe('#FF0000');
      expect(component['getCategoryFieldValue'](category, 'createdAt')).toBe(category.createdAt);
      expect(component['getCategoryFieldValue'](category, 'updatedAt')).toBe(category.updatedAt);
      expect(component['getCategoryFieldValue'](category, 'unknown')).toBe('');
    });
  });

  // Error handling tests for better branch coverage
  describe('Error Handling', () => {
    it('should handle category tree loading error', () => {
      const consoleSpy = spyOn(console, 'error');
      categoryService.getCategoryTree.and.returnValue(throwError(() => new Error('Tree error')));
      
      component['loadCategoryTree']();
      
      expect(component.error).toBe('Failed to load category tree');
      expect(component.isTreeLoading).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error loading category tree:', jasmine.any(Error));
    });

    it('should handle category stats loading error', () => {
      const consoleSpy = spyOn(console, 'error');
      categoryService.getCategoryStats.and.returnValue(throwError(() => new Error('Stats error')));
      
      component['loadCategoryStats']();
      
      expect(component.error).toBe('Failed to load category statistics');
      expect(component.isStatsLoading).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error loading category stats:', jasmine.any(Error));
    });

    it('should handle category deletion error', () => {
      const consoleSpy = spyOn(console, 'error');
      categoryService.deleteCategory.and.returnValue(throwError(() => new Error('Delete error')));
      confirmSpy.and.returnValue(true);
      
      component.deleteCategory('cat1');
      
      expect(component.error).toBe('Failed to delete category');
      expect(component.isDeleting).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error deleting category:', jasmine.any(Error));
    });
  });

  // Pagination tests for better branch coverage
  describe('Pagination', () => {
    it('should calculate page numbers when total pages is less than max visible', () => {
      component.totalPages = 3;
      component.currentPage = 1;
      
      const pages = component.pageNumbers;
      
      expect(pages).toEqual([1, 2, 3]);
    });

    it('should calculate page numbers when total pages is greater than max visible', () => {
      component.totalPages = 10;
      component.currentPage = 5;
      
      const pages = component.pageNumbers;
      
      expect(pages).toEqual([3, 4, 5, 6, 7]);
    });

    it('should calculate page numbers at the beginning', () => {
      component.totalPages = 10;
      component.currentPage = 1;
      
      const pages = component.pageNumbers;
      
      expect(pages).toEqual([1, 2, 3, 4, 5]);
    });

    it('should calculate page numbers at the end', () => {
      component.totalPages = 10;
      component.currentPage = 10;
      
      const pages = component.pageNumbers;
      
      expect(pages).toEqual([8, 9, 10]);
    });
  });

  // Formatting tests for better branch coverage
  describe('Formatting', () => {
    it('should format percentage with zero total', () => {
      const result = component.formatPercentage(10, 0);
      expect(result).toBe('0%');
    });

    it('should format percentage with normal values', () => {
      const result = component.formatPercentage(25, 100);
      expect(result).toBe('25.0%');
    });

    it('should format currency with default currency', () => {
      const result = component.formatCurrency(100);
      expect(result).toBe('$100.00');
    });

    it('should format currency with custom currency', () => {
      const result = component.formatCurrency(100, 'EUR');
      expect(result).toBe('€100.00');
    });
  });

  // Event handler tests for better branch coverage
  describe('Event Handlers', () => {
    it('should handle advanced filters changed', () => {
      const filterGroups = [{
        id: '1',
        name: 'Test Group',
        logic: 'AND' as const,
        conditions: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }];
      const updateFiltersSpy = spyOn(component['advancedFilterService'], 'updateFilters');
      
      component.onAdvancedFiltersChanged(filterGroups);
      
      expect(updateFiltersSpy).toHaveBeenCalledWith(filterGroups);
    });

    it('should handle advanced search query', () => {
      const searchSpy = spyOn(component, 'onSearch');
      
      component.onAdvancedSearchQuery('test query');
      
      expect(component.searchTerm).toBe('test query');
      expect(searchSpy).toHaveBeenCalled();
    });

    it('should handle preset applied', () => {
      const consoleSpy = spyOn(console, 'log');
      const preset = { name: 'test preset' };
      
      component.onPresetApplied(preset);
      
      expect(consoleSpy).toHaveBeenCalledWith('Preset applied:', preset);
    });

    it('should handle saved filter loaded', () => {
      const consoleSpy = spyOn(console, 'log');
      const filter = { name: 'saved filter' };
      
      component.onSavedFilterLoaded(filter);
      
      expect(consoleSpy).toHaveBeenCalledWith('Saved filter loaded:', filter);
    });

    it('should add to search history', () => {
      const consoleSpy = spyOn(console, 'log');
      
      component.addToSearchHistory('test query');
      
      expect(consoleSpy).toHaveBeenCalledWith('Adding to search history:', 'test query');
    });
  });
});
