import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CategoryService } from './category.service';
import { Category, CategoryStats, ApiResponse } from '../models/financial.model';
import { environment } from '../../../environments/environment';

describe('CategoryService', () => {
  let service: CategoryService;
  let httpMock: HttpTestingController;

  const mockCategory: Category = {
    _id: 'cat1',
    name: 'Test Category',
    description: 'Test Description',
    color: '#FF0000',
    icon: 'test-icon',
    path: ['Test Category'],
    level: 1,
    isActive: true,
    isSystem: false,
    userId: 'user1',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockChildCategory: Category = {
    _id: 'cat2',
    name: 'Child Category',
    description: 'Child Description',
    color: '#00FF00',
    icon: 'child-icon',
    parentId: 'cat1',
    path: ['Test Category', 'Child Category'],
    level: 2,
    isActive: true,
    isSystem: false,
    userId: 'user1',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockCategoryStats: CategoryStats = {
    totalCategories: 10,
    activeCategories: 8,
    categoriesByLevel: { 1: 5, 2: 3, 3: 2 },
    topCategories: [
      {
        categoryId: 'cat1',
        name: 'Test Category',
        transactionCount: 50,
        totalAmount: 1000,
        percentage: 25
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CategoryService]
    });
    service = TestBed.inject(CategoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    if (httpMock) {
      httpMock.verify();
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getUserCategories', () => {
    it('should get user categories with basic options', () => {
      const options = { page: 1, limit: 10, sortBy: 'name', sortOrder: 'asc' as const };

      service.getUserCategories(options).subscribe(categories => {
        expect(categories).toEqual([mockCategory]);
      });

      const req = httpMock.expectOne(request => 
        request.url === `${environment.apiUrl}/categories` &&
        request.params.get('page') === '1' &&
        request.params.get('limit') === '10' &&
        request.params.get('sortBy') === 'name' &&
        request.params.get('sortOrder') === 'asc'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [mockCategory] });
    });

    it('should get user categories with search', () => {
      const options = { search: 'test' };

      service.getUserCategories(options).subscribe(categories => {
        expect(categories).toEqual([mockCategory]);
      });

      const req = httpMock.expectOne(request => 
        request.url === `${environment.apiUrl}/categories` &&
        request.params.get('search') === 'test'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [mockCategory] });
    });

    it('should handle errors', () => {
      service.getUserCategories().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/categories`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getCategoryTree', () => {
    it('should get category tree structure', () => {
      service.getCategoryTree().subscribe(tree => {
        expect(tree).toEqual([mockCategory, mockChildCategory]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/categories/tree`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [mockCategory, mockChildCategory] });
    });

    it('should handle errors', () => {
      service.getCategoryTree().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/categories/tree`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getCategoryStats', () => {
    it('should get category statistics', () => {
      service.getCategoryStats().subscribe(stats => {
        expect(stats).toEqual(mockCategoryStats);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/categories/stats`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockCategoryStats });
    });

    it('should handle errors', () => {
      service.getCategoryStats().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/categories/stats`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getCategoryById', () => {
    it('should get category by ID', () => {
      const id = 'cat1';

      service.getCategoryById(id).subscribe(category => {
        expect(category).toEqual(mockCategory);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/categories/${id}`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockCategory });
    });
  });

  describe('createCategory', () => {
    it('should create new category', () => {
      const categoryData = {
        name: 'New Category',
        description: 'New Description',
        color: '#0000FF',
        icon: 'new-icon'
      };

      service.createCategory(categoryData).subscribe(category => {
        expect(category).toEqual(mockCategory);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/categories`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(categoryData);
      req.flush({ success: true, data: mockCategory });
    });
  });

  describe('updateCategory', () => {
    it('should update category', () => {
      const id = 'cat1';
      const updateData = { name: 'Updated Category' };

      service.updateCategory(id, updateData).subscribe(category => {
        expect(category).toEqual(mockCategory);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/categories/${id}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateData);
      req.flush({ success: true, data: mockCategory });
    });
  });

  describe('deleteCategory', () => {
    it('should delete category', () => {
      const id = 'cat1';

      service.deleteCategory(id).subscribe(result => {
        expect(result).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/categories/${id}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, data: true });
    });
  });

  describe('bulkCreateCategories', () => {
    it('should bulk create categories', () => {
      const categories = [
        { name: 'Category 1', description: 'Description 1' },
        { name: 'Category 2', description: 'Description 2' }
      ];

      service.bulkCreateCategories(categories).subscribe(result => {
        expect(result).toEqual([mockCategory, mockChildCategory]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/categories/bulk`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ categories });
      req.flush({ success: true, data: [mockCategory, mockChildCategory] });
    });
  });

  describe('Filtered Queries', () => {
    beforeEach(() => {
      // Set up some categories in the service state for filtering tests
      service['categoryStateSubject'].next({
        categories: [mockCategory, mockChildCategory],
        categoryTree: [mockCategory, mockChildCategory],
        stats: null,
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      });
    });

    it('should get categories by parent ID', () => {
      service.getCategoriesByParent('cat1').subscribe(categories => {
        expect(categories).toEqual([mockChildCategory]);
      });
    });

    it('should get root categories when no parent ID', () => {
      service.getCategoriesByParent().subscribe(categories => {
        expect(categories).toEqual([mockCategory]);
      });
    });

    it('should get active categories only', () => {
      service.getActiveCategories().subscribe(categories => {
        expect(categories).toEqual([mockCategory, mockChildCategory]);
      });
    });

    it('should search categories by name', () => {
      service.searchCategories('Test').subscribe(categories => {
        expect(categories).toEqual([mockCategory]);
      });
    });

    it('should search categories by description', () => {
      service.searchCategories('Child').subscribe(categories => {
        expect(categories).toEqual([mockChildCategory]);
      });
    });
  });

  describe('refreshCategories', () => {
    it('should refresh all category data', () => {
      service.refreshCategories().subscribe(categories => {
        expect(categories).toEqual([mockCategory]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/categories`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [mockCategory] });
    });
  });

  describe('State Management', () => {
    it('should provide category state observable', () => {
      service.categoryState$.subscribe(state => {
        expect(state).toBeDefined();
        expect(state.categories).toEqual([]);
        expect(state.isLoading).toBe(false);
        expect(state.error).toBeNull();
      });
    });

    it('should provide categories observable', () => {
      service.categories$.subscribe(categories => {
        expect(categories).toEqual([]);
      });
    });

    it('should provide category tree observable', () => {
      service.categoryTree$.subscribe(tree => {
        expect(tree).toEqual([]);
      });
    });

    it('should provide stats observable', () => {
      service.stats$.subscribe(stats => {
        expect(stats).toBeNull();
      });
    });

    it('should provide loading state observable', () => {
      service.isLoading$.subscribe(isLoading => {
        expect(typeof isLoading).toBe('boolean');
      });
    });

    it('should provide error state observable', () => {
      service.error$.subscribe(error => {
        expect(error).toBeDefined();
      });
    });

    it('should get current category state', () => {
      const state = service.getCurrentCategoryState();
      expect(state).toBeDefined();
      expect(state.categories).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should clear cache', () => {
      service.clearCache();
      const state = service.getCurrentCategoryState();
      expect(state.categories).toEqual([]);
      expect(state.categoryTree).toEqual([]);
      expect(state.stats).toBeNull();
      expect(state.lastUpdated).toBeNull();
    });
  });
});
