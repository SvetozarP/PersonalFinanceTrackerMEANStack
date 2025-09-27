import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, take } from 'rxjs';
import { Category } from '../../../../core/models/financial.model';
import { CategoryService } from '../../../../core/services/category.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-category-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './category-details.html',
  styleUrls: ['./category-details.scss']
})
export class CategoryDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  category: Category | null = null;
  parentCategory: Category | null = null;
  subcategories: Category[] = [];
  
  // Loading states
  isCategoryLoading = false;
  isParentLoading = false;
  isSubcategoriesLoading = false;
  
  error: string | null = null;
  
  // Category ID from route
  categoryId: string | null = null;
  private isInitialized = false;

  ngOnInit(): void {
    this.loadCategory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCategory(): void {
    if (this.isInitialized) {
      console.log('Category Details: Already initialized, skipping loadCategory');
      return;
    }

    this.route.params
      .pipe(
        take(1), // Only take the first emission to prevent duplicate processing
        takeUntil(this.destroy$)
      )
      .subscribe(params => {
        console.log('Category Details: Route params:', params);
        this.categoryId = params['id'];
        console.log('Category Details: Extracted categoryId:', this.categoryId);
        
        this.isInitialized = true; // Mark as initialized
        
        if (this.categoryId) {
          this.fetchCategoryDetails();
        } else {
          console.error('Category Details: No categoryId found in route params');
          this.error = 'Category ID not found in URL';
          this.isCategoryLoading = false;
        }
      });
  }

  private fetchCategoryDetails(): void {
    if (!this.categoryId) return;

    // Prevent duplicate loading if already loading or already loaded
    if (this.isCategoryLoading || (this.category && this.category._id === this.categoryId)) {
      console.log('Category Details: Skipping duplicate load for category:', this.categoryId);
      return;
    }

    console.log('Category Details: Fetching category with ID:', this.categoryId);
    this.isCategoryLoading = true;
    this.error = null;

    this.categoryService.getCategoryById(this.categoryId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (category) => {
          console.log('Category Details: Successfully loaded category:', category);
          this.category = category;
          this.isCategoryLoading = false;
          console.log('Category Details: isCategoryLoading set to:', this.isCategoryLoading);
          console.log('Category Details: category set to:', this.category);
          
          // Force change detection
          this.cdr.detectChanges();
          console.log('Category Details: Change detection triggered');
          
          // Load parent category if exists
          if (category.parentId) {
            this.loadParentCategory(category.parentId);
          }
          
          // Load subcategories
          this.loadSubcategories();
        },
        error: (error) => {
          console.error('Category Details: Error loading category:', error);
          this.error = 'Failed to load category details';
          this.isCategoryLoading = false;
        }
      });
  }

  private loadParentCategory(parentId: string): void {
    this.isParentLoading = true;
    
    this.categoryService.getCategoryById(parentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (parent) => {
          this.parentCategory = parent;
          this.isParentLoading = false;
        },
        error: (error) => {
          console.error('Error loading parent category:', error);
          this.isParentLoading = false;
        }
      });
  }

  private loadSubcategories(): void {
    if (!this.categoryId) return;

    console.log('Category Details: Loading subcategories for categoryId:', this.categoryId);
    this.isSubcategoriesLoading = true;
    
    this.categoryService.getUserCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories: Category[]) => {
          console.log('Category Details: Loaded all categories:', categories.length);
          this.subcategories = categories.filter((cat: Category) => cat.parentId === this.categoryId);
          this.isSubcategoriesLoading = false;
          console.log('Category Details: Found subcategories:', this.subcategories.length);
          console.log('Category Details: isSubcategoriesLoading set to:', this.isSubcategoriesLoading);
        },
        error: (error: any) => {
          console.error('Category Details: Error loading subcategories:', error);
          this.isSubcategoriesLoading = false;
        }
      });
  }

  onEdit(): void {
    if (this.categoryId) {
      this.router.navigate(['/financial/categories', this.categoryId, 'edit']);
    }
  }

  onBack(): void {
    this.router.navigate(['/financial/categories']);
  }

  onDelete(): void {
    if (!this.category || this.category.isSystem) return;
    
    if (confirm(`Are you sure you want to delete the category "${this.category.name}"? This action cannot be undone.`)) {
      this.categoryService.deleteCategory(this.category._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.router.navigate(['/financial/categories']);
          },
          error: (error) => {
            this.error = 'Failed to delete category';
            console.error('Error deleting category:', error);
          }
        });
    }
  }

  getCategoryIcon(category: Category): string {
    return category.icon || 'fa-tag';
  }

  getCategoryStatusClass(category: Category): string {
    return category.isActive ? 'status-active' : 'status-inactive';
  }

  getCategoryLevelClass(level: number): string {
    return `level-${level}`;
  }

  // Debug method to check current state
  checkLoadingState(): void {
    console.log('Category Details: Current loading states:', {
      isCategoryLoading: this.isCategoryLoading,
      isParentLoading: this.isParentLoading,
      isSubcategoriesLoading: this.isSubcategoriesLoading,
      category: this.category,
      error: this.error
    });
  }
}
