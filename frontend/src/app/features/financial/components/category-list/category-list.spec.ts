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
      'getUserCategories', 'getCategoryTree', 'getCategoryStats', 'deleteCategory'
    ]);

    // Setup default return values
    categoryServiceSpy.getUserCategories.and.returnValue(of(mockCategories));
    categoryServiceSpy.getCategoryTree.and.returnValue(of(mockCategories));
    categoryServiceSpy.getCategoryStats.and.returnValue(of(mockStats));
    categoryServiceSpy.deleteCategory.and.returnValue(of(true));

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
    component.onSort('name');
    expect(component.sortOrder).toBe('desc');

    component.onSort('name');
    expect(component.sortOrder).toBe('asc');

    // Test different column
    component.onSort('level');
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
    const activeClass = component.getCategoryStatusClass(true);
    const inactiveClass = component.getCategoryStatusClass(false);

    expect(activeClass).toBe('status-active');
    expect(inactiveClass).toBe('status-inactive');
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
});
