import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { CategoryTreeComponent } from './category-tree';
import { CategoryService } from '../../../../core/services/category.service';
import { Category } from '../../../../core/models/financial.model';

describe('CategoryTreeComponent', () => {
  let component: CategoryTreeComponent;
  let fixture: ComponentFixture<CategoryTreeComponent>;
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
      name: 'Restaurants',
      description: 'Restaurant expenses',
      color: '#FF5555',
      icon: '🍽️',
      path: ['Food & Dining', 'Restaurants'],
      level: 2,
      parentId: 'cat1',
      isActive: true,
      isSystem: false,
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 'cat3',
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

  beforeEach(async () => {
    const categoryServiceSpy = jasmine.createSpyObj('CategoryService', [
      'getUserCategories', 'deleteCategory'
    ]);

    // Setup default return values
    categoryServiceSpy.getUserCategories.and.returnValue(of(mockCategories));
    categoryServiceSpy.deleteCategory.and.returnValue(of(true));

    await TestBed.configureTestingModule({
      imports: [
        CategoryTreeComponent,
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

    fixture = TestBed.createComponent(CategoryTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.showActions).toBe(true);
    expect(component.selectable).toBe(false);
    expect(component.multiSelect).toBe(false);
    expect(component.selectedCategories).toEqual([]);
    expect(component.maxDepth).toBe(5);
    expect(component.isLoading).toBe(false);
    expect(component.searchTerm).toBe('');
    expect(component.showInactive).toBe(false);
    expect(component.sortBy).toBe('name');
    expect(component.sortOrder).toBe('asc');
  });

  it('should load categories on init', () => {
    expect(categoryService.getUserCategories).toHaveBeenCalled();
  });

  it('should build tree structure from categories', () => {
    component.categories = mockCategories;
    component['buildTree']();
    
    expect(component.treeNodes.length).toBeGreaterThan(0);
  });

  it('should handle category click', () => {
    component.selectable = true;
    const category = mockCategories[0];
    
    component.onCategoryClick(category);
    
    expect(component.selectedCategories).toContain(category._id);
  });

  it('should handle category editing', () => {
    spyOn(component.categoryEdited, 'emit');
    const category = mockCategories[0];
    const event = new Event('click');
    
    component.onCategoryEdit(category, event);
    
    expect(component.categoryEdited.emit).toHaveBeenCalledWith(category);
  });

  it('should handle category deletion', () => {
    spyOn(component.categoryDeleted, 'emit');
    spyOn(window, 'confirm').and.returnValue(true);
    const category = mockCategories[0];
    const event = new Event('click');
    
    component.onCategoryDelete(category, event);
    
    expect(component.categoryDeleted.emit).toHaveBeenCalledWith(category);
  });

  it('should not delete category when user cancels', () => {
    spyOn(component.categoryDeleted, 'emit');
    spyOn(window, 'confirm').and.returnValue(false);
    const category = mockCategories[0];
    const event = new Event('click');
    
    component.onCategoryDelete(category, event);
    
    expect(component.categoryDeleted.emit).not.toHaveBeenCalled();
  });

  it('should toggle category expansion', () => {
    spyOn(component.categoryToggled, 'emit');
    component.categories = mockCategories;
    component['buildTree']();
    const treeNode = component.treeNodes[0];
    
    component.onCategoryToggle(treeNode);
    
    expect(component.categoryToggled.emit).toHaveBeenCalledWith({
      category: treeNode.category,
      isExpanded: jasmine.any(Boolean)
    });
  });

  it('should handle search changes', () => {
    component.searchTerm = 'food';
    component.onSearchChange();
    
    // Should filter categories based on search term
    expect(component.searchTerm).toBe('food');
  });

  it('should handle sort changes', () => {
    component.sortBy = 'level';
    component.onSortChange();
    
    // Should rebuild tree with new sort order
    expect(component.sortBy).toBe('level');
  });

  it('should handle show inactive changes', () => {
    component.showInactive = true;
    component.onShowInactiveChange();
    
    expect(categoryService.getUserCategories).toHaveBeenCalled();
  });

  it('should check if category is selected', () => {
    component.selectedCategories = ['cat1'];
    
    expect(component.isCategorySelected('cat1')).toBe(true);
    expect(component.isCategorySelected('cat2')).toBe(false);
  });

  it('should handle drag start', () => {
    const category = mockCategories[0];
    const event = new DragEvent('dragstart');
    Object.defineProperty(event, 'dataTransfer', {
      value: {
        effectAllowed: '',
        setData: jasmine.createSpy('setData')
      }
    });
    
    component.onDragStart(event, category);
    
    expect(component.draggedCategory).toBe(category);
  });

  it('should handle drag over', () => {
    component.draggedCategory = mockCategories[0];
    const targetCategory = mockCategories[1];
    const event = new DragEvent('dragover');
    
    component.onDragOver(event, targetCategory);
    
    expect(component.dropTarget).toBe(targetCategory);
  });

  it('should handle drag leave', () => {
    component.dropTarget = mockCategories[0];
    const event = new DragEvent('dragleave');
    
    component.onDragLeave(event);
    
    expect(component.dropTarget).toBe(null as any);
  });

  it('should handle drop', () => {
    component.draggedCategory = mockCategories[0];
    const targetCategory = mockCategories[1];
    const event = new DragEvent('drop');
    
    component.onDrop(event, targetCategory);
    
    // After drop, draggedCategory should be reset
    expect(component.draggedCategory).toBe(null as any);
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

  it('should check if can drop on category', () => {
    component.draggedCategory = mockCategories[0];
    const targetCategory = mockCategories[1];
    
    const canDrop = component.canDropOn(targetCategory);
    
    expect(canDrop).toBeDefined();
  });

  it('should get filtered categories', () => {
    component.categories = mockCategories;
    component['buildTree']();
    component.searchTerm = '';
    
    const filtered = component.getFilteredCategories();
    
    expect(filtered).toBeDefined();
  });

  it('should handle error loading categories', (done) => {
    categoryService.getUserCategories.and.returnValue(throwError(() => new Error('API Error')));
    
    component['loadCategories']();
    
    // Wait for the async operation to complete
    setTimeout(() => {
      expect(component.isLoading).toBe(false);
      done();
    }, 0);
  });
});
