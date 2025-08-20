import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError, tap, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Category, CategoryStats, ApiResponse, QueryOptions } from '../models/financial.model';

export interface CategoryState {
  categories: Category[];
  categoryTree: Category[];
  stats: CategoryStats | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly baseUrl = `${environment.apiUrl}/categories`;
  
  // Inject dependencies using @inject()
  private http = inject(HttpClient);
  
  // Reactive state management
  private categoryStateSubject = new BehaviorSubject<CategoryState>({
    categories: [],
    categoryTree: [],
    stats: null,
    isLoading: false,
    error: null,
    lastUpdated: null
  });

  // Public observables
  public readonly categoryState$ = this.categoryStateSubject.asObservable();
  public readonly categories$ = this.categoryState$.pipe(
    map(state => state.categories)
  );
  public readonly categoryTree$ = this.categoryState$.pipe(
    map(state => state.categoryTree)
  );
  public readonly stats$ = this.categoryState$.pipe(
    map(state => state.stats)
  );
  public readonly isLoading$ = this.categoryState$.pipe(
    map(state => state.isLoading)
  );
  public readonly error$ = this.categoryState$.pipe(
    map(state => state.error)
  );

  // Cache
  private categoriesCache: Category[] = [];
  private categoryTreeCache: Category[] = [];
  private statsCache: CategoryStats | null = null;
  private cacheExpiry = 10 * 60 * 1000; // 10 minutes

  /**
   * Get all categories for the current user
   */
  getUserCategories(options: QueryOptions = {}): Observable<Category[]> {
    // Check cache first
    if (this.categoriesCache.length > 0 && this.isCacheValid()) {
      this.updateCategoryState({
        categories: this.categoriesCache,
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      });
      return of(this.categoriesCache);
    }

    // Set loading state
    this.updateCategoryState({
      categories: this.categoriesCache,
      isLoading: true,
      error: null,
      lastUpdated: this.categoryStateSubject.value.lastUpdated
    });

    // Build query parameters
    let params = new HttpParams();
    if (options.page) params = params.set('page', options.page.toString());
    if (options.limit) params = params.set('limit', options.limit.toString());
    if (options.sortBy) params = params.set('sortBy', options.sortBy);
    if (options.sortOrder) params = params.set('sortOrder', options.sortOrder);
    if (options.search) params = params.set('search', options.search);

    return this.http.get<ApiResponse<Category[]>>(this.baseUrl, { params })
      .pipe(
        map(response => response.data),
        tap(categories => {
          this.categoriesCache = categories;
          this.updateCategoryState({
            categories,
            isLoading: false,
            error: null,
            lastUpdated: new Date()
          });
        }),
        catchError(error => {
          const errorMessage = this.handleError(error);
          this.updateCategoryState({
            categories: this.categoriesCache,
            isLoading: false,
            error: errorMessage,
            lastUpdated: this.categoryStateSubject.value.lastUpdated
          });
          return throwError(() => new Error(errorMessage));
        }),
        shareReplay(1)
      );
  }

  /**
   * Get category tree structure
   */
  getCategoryTree(): Observable<Category[]> {
    // Check cache first
    if (this.categoryTreeCache.length > 0 && this.isCacheValid()) {
      this.updateCategoryState({
        categoryTree: this.categoryTreeCache,
        lastUpdated: new Date()
      });
      return of(this.categoryTreeCache);
    }

    return this.http.get<ApiResponse<Category[]>>(`${this.baseUrl}/tree`)
      .pipe(
        map(response => response.data),
        tap(tree => {
          this.categoryTreeCache = tree;
          this.updateCategoryState({
            categoryTree: tree,
            lastUpdated: new Date()
          });
        }),
        catchError(error => throwError(() => new Error(this.handleError(error))))
      );
  }

  /**
   * Get category statistics
   */
  getCategoryStats(): Observable<CategoryStats> {
    // Check cache first
    if (this.statsCache && this.isCacheValid()) {
      this.updateCategoryState({
        stats: this.statsCache,
        lastUpdated: new Date()
      });
      return of(this.statsCache);
    }

    return this.http.get<ApiResponse<CategoryStats>>(`${this.baseUrl}/stats`)
      .pipe(
        map(response => response.data),
        tap(stats => {
          this.statsCache = stats;
          this.updateCategoryState({
            stats,
            lastUpdated: new Date()
          });
        }),
        catchError(error => throwError(() => new Error(this.handleError(error))))
      );
  }

  /**
   * Get category by ID
   */
  getCategoryById(id: string): Observable<Category> {
    return this.http.get<ApiResponse<Category>>(`${this.baseUrl}/${id}`)
      .pipe(
        map(response => response.data),
        catchError(error => throwError(() => new Error(this.handleError(error))))
      );
  }

  /**
   * Create new category
   */
  createCategory(categoryData: Partial<Category>): Observable<Category> {
    return this.http.post<ApiResponse<Category>>(this.baseUrl, categoryData)
      .pipe(
        map(response => response.data),
        tap(category => {
          // Add to cache and update state
          this.categoriesCache = [...this.categoriesCache, category];
          this.updateCategoryState({
            categories: this.categoriesCache,
            lastUpdated: new Date()
          });
          // Clear tree cache as it needs to be rebuilt
          this.categoryTreeCache = [];
        }),
        catchError(error => throwError(() => new Error(this.handleError(error))))
      );
  }

  /**
   * Update category
   */
  updateCategory(id: string, categoryData: Partial<Category>): Observable<Category> {
    return this.http.put<ApiResponse<Category>>(`${this.baseUrl}/${id}`, categoryData)
      .pipe(
        map(response => response.data),
        tap(updatedCategory => {
          // Update cache
          this.categoriesCache = this.categoriesCache.map(cat => 
            cat._id === id ? updatedCategory : cat
          );
          this.updateCategoryState({
            categories: this.categoriesCache,
            lastUpdated: new Date()
          });
          // Clear tree cache as it needs to be rebuilt
          this.categoryTreeCache = [];
        }),
        catchError(error => throwError(() => new Error(this.handleError(error))))
      );
  }

  /**
   * Delete category
   */
  deleteCategory(id: string): Observable<boolean> {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/${id}`)
      .pipe(
        map(response => response.data),
        tap(() => {
          // Remove from cache
          this.categoriesCache = this.categoriesCache.filter(cat => cat._id !== id);
          this.updateCategoryState({
            categories: this.categoriesCache,
            lastUpdated: new Date()
          });
          // Clear tree cache as it needs to be rebuilt
          this.categoryTreeCache = [];
        }),
        catchError(error => throwError(() => new Error(this.handleError(error))))
      );
  }

  /**
   * Bulk create categories
   */
  bulkCreateCategories(categories: Partial<Category>[]): Observable<Category[]> {
    return this.http.post<ApiResponse<Category[]>>(`${this.baseUrl}/bulk`, { categories })
      .pipe(
        map(response => response.data),
        tap(newCategories => {
          // Add to cache
          this.categoriesCache = [...this.categoriesCache, ...newCategories];
          this.updateCategoryState({
            categories: this.categoriesCache,
            lastUpdated: new Date()
          });
          // Clear tree cache as it needs to be rebuilt
          this.categoryTreeCache = [];
        }),
        catchError(error => throwError(() => new Error(this.handleError(error))))
      );
  }

  /**
   * Get categories by parent ID
   */
  getCategoriesByParent(parentId?: string): Observable<Category[]> {
    return this.categories$.pipe(
      map(categories => {
        if (!parentId) {
          return categories.filter(cat => !cat.parentId);
        }
        return categories.filter(cat => cat.parentId === parentId);
      })
    );
  }

  /**
   * Get active categories only
   */
  getActiveCategories(): Observable<Category[]> {
    return this.categories$.pipe(
      map(categories => categories.filter(cat => cat.isActive))
    );
  }

  /**
   * Search categories by name
   */
  searchCategories(searchTerm: string): Observable<Category[]> {
    return this.categories$.pipe(
      map(categories => 
        categories.filter(cat => 
          cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      )
    );
  }

  /**
   * Refresh all category data
   */
  refreshCategories(): Observable<Category[]> {
    this.clearCache();
    return this.getUserCategories();
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.categoriesCache = [];
    this.categoryTreeCache = [];
    this.statsCache = null;
    this.updateCategoryState({
      categories: [],
      categoryTree: [],
      stats: null,
      isLoading: false,
      error: null,
      lastUpdated: null
    });
  }

  /**
   * Get current category state
   */
  getCurrentCategoryState(): CategoryState {
    return this.categoryStateSubject.value;
  }

  /**
   * Private methods
   */
  private updateCategoryState(partialState: Partial<CategoryState>): void {
    const currentState = this.categoryStateSubject.value;
    this.categoryStateSubject.next({ ...currentState, ...partialState });
  }

  private isCacheValid(): boolean {
    if (!this.categoryStateSubject.value.lastUpdated) return false;
    const now = new Date().getTime();
    const lastUpdated = this.categoryStateSubject.value.lastUpdated.getTime();
    return (now - lastUpdated) < this.cacheExpiry;
  }

  private handleError(error: any): string {
    if (error.error instanceof ErrorEvent) {
      return error.error.message;
    } else {
      return error.error?.message || error.message || 'An error occurred';
    }
  }
}