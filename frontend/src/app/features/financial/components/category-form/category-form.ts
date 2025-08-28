import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Subject, takeUntil, switchMap, of } from 'rxjs';
import { Category } from '../../../../core/models/financial.model';
import { CategoryService } from '../../../../core/services/category.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './category-form.html',
  styleUrls: ['./category-form.scss']
})
export class CategoryFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // Initialize the form group
  categoryForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    description: ['', [Validators.maxLength(200)]],
    color: ['#667eea', Validators.required],
    icon: ['🏷️', Validators.required],
    parentId: [''],
    isActive: [true]
  });

  category: Category | null = null;
  parentCategories: Category[] = [];
  
  // Granular loading states
  isFormLoading = false;
  isParentCategoriesLoading = false;
  isSubmitting = false;
  
  error: string | null = null;
  
  // Form mode
  isEditMode = false;
  categoryId: string | null = null;
  
  // Color and icon options
  colorOptions = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe',
    '#43e97b', '#38f9d7', '#fa709a', '#fee140', '#a8edea', '#fed6e3',
    '#ffecd2', '#fcb69f', '#ff9a9e', '#fecfef', '#fecfef', '#fad0c4'
  ];

  iconOptions = [
    '🏷️', '🏠', '🏢', '🏪', '🏥', '🏦', '🏨', '🏫', '🏬', '🏭', '🏯', '🏰',
    '💼', '📱', '💻', '🎮', '🎬', '🎵', '📚', '✈️', '🚗', '🚌', '🚲',
    '🍕', '🍔', '🍽️', '🍰', '🍦', '☕', '🍺', '🍷', '💊', '🩺', '💉',
    '👕', '👖', '👗', '👠', '👟', '👜', '💄', '💍', '💎', '🎁', '🎈'
  ];

  // Icon descriptions for tooltips
  iconDescriptions: { [key: string]: string } = {
    '🏷️': 'Label/Tag',
    '🏠': 'Home',
    '🏢': 'Office Building',
    '🏪': 'Convenience Store',
    '🏥': 'Hospital',
    '🏦': 'Bank',
    '🏨': 'Hotel',
    '🏫': 'School',
    '🏬': 'Department Store',
    '🏭': 'Factory',
    '🏯': 'Japanese Castle',
    '🏰': 'Castle',
    '💼': 'Briefcase',
    '📱': 'Mobile Phone',
    '💻': 'Laptop',
    '🎮': 'Game Controller',
    '🎬': 'Film',
    '🎵': 'Music Note',
    '📚': 'Books',
    '✈️': 'Airplane',
    '🚗': 'Car',
    '🚌': 'Bus',
    '🚲': 'Bicycle',
    '🍕': 'Pizza',
    '🍔': 'Hamburger',
    '🍽️': 'Fork and Knife',
    '🍰': 'Cake',
    '🍦': 'Ice Cream',
    '☕': 'Coffee',
    '🍺': 'Beer',
    '🍷': 'Wine Glass',
    '💊': 'Pill',
    '🩺': 'Stethoscope',
    '💉': 'Syringe',
    '👕': 'T-Shirt',
    '👖': 'Jeans',
    '👗': 'Dress',
    '👠': 'High-Heeled Shoe',
    '👟': 'Running Shoe',
    '👜': 'Handbag',
    '💄': 'Lipstick',
    '💍': 'Ring',
    '💎': 'Diamond',
    '🎁': 'Gift',
    '🎈': 'Balloon'
  };



  ngOnInit(): void {
    this.loadParentCategories();
    this.checkEditMode();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkEditMode(): void {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap(params => {
          const id = params.get('id');
          if (id && id !== 'new') {
            this.isEditMode = true;
            this.categoryId = id;
            // loadCategory returns void, so we need to return an observable
            this.loadCategory(id);
            return of(null); // Return observable that completes immediately
          } else {
            // Return an observable that completes immediately for new category mode
            return of(null);
          }
        })
      )
      .subscribe();
  }

  private loadCategory(categoryId: string): void {
    this.isFormLoading = true;
    this.error = null;

    this.categoryService.getCategoryById(categoryId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (category) => {
          this.category = category;
          this.populateForm(category);
          this.isFormLoading = false;
        },
        error: (error) => {
          this.error = 'Failed to load category';
          this.isFormLoading = false;
          console.error('Error loading category:', error);
        }
      });
  }

  private loadParentCategories(): void {
    this.isParentCategoriesLoading = true;
    // Disable the parentId control while loading
    this.categoryForm.get('parentId')?.disable();

    this.categoryService.getUserCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          // Filter out the current category if in edit mode
          if (this.isEditMode && this.categoryId) {
            this.parentCategories = categories.filter(cat => cat._id !== this.categoryId);
          } else {
            this.parentCategories = categories;
          }
          this.isParentCategoriesLoading = false;
          // Re-enable the parentId control after loading
          this.categoryForm.get('parentId')?.enable();
        },
        error: (error) => {
          console.error('Error loading parent categories:', error);
          this.isParentCategoriesLoading = false;
          // Re-enable the parentId control even on error
          this.categoryForm.get('parentId')?.enable();
        }
      });
  }

  private populateForm(category: Category): void {
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description || '',
      color: category.color || '#667eea',
      icon: category.icon || '🏷️',
      parentId: category.parentId || '',
      isActive: category.isActive !== undefined ? category.isActive : true
    });
  }

  onParentCategoryChange(parentId: string): void {
    // This method is called when parent category changes
    // You can add logic here if needed
    console.log('Parent category changed to:', parentId);
  }

  onColorSelect(color: string): void {
    this.categoryForm.patchValue({ color });
  }

  onIconSelect(icon: string): void {
    this.categoryForm.patchValue({ icon });
  }

  onSubmit(): void {
    if (this.categoryForm.valid) {
      this.isSubmitting = true;
      this.error = null;

      const formData = this.categoryForm.value;
      
      // Prepare the category data
      const categoryData: Partial<Category> = {
        name: formData.name,
        description: formData.description,
        color: formData.color,
        icon: formData.icon,
        parentId: formData.parentId || null,
        isActive: formData.isActive
      };

      if (this.isEditMode && this.categoryId) {
        // Update existing category
        this.categoryService.updateCategory(this.categoryId, categoryData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (updatedCategory) => {
              this.isSubmitting = false;
              this.router.navigate(['/financial/categories']);
            },
            error: (error) => {
              this.error = 'Failed to update category';
              this.isSubmitting = false;
              console.error('Error updating category:', error);
            }
          });
      } else {
        // Create new category
        this.categoryService.createCategory(categoryData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (newCategory) => {
              this.isSubmitting = false;
              this.router.navigate(['/financial/categories']);
            },
            error: (error) => {
              this.error = 'Failed to create category';
              this.isSubmitting = false;
              console.error('Error creating category:', error);
            }
          });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/financial/categories']);
  }

  resetForm(): void {
    if (this.category) {
      this.populateForm(this.category);
    } else {
      this.categoryForm.reset({
        name: '',
        description: '',
        color: '#667eea',
        icon: '🏷️',
        parentId: '',
        isActive: true
      });
    }
    // Ensure all controls are enabled after reset
    this.categoryForm.enable();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.categoryForm.controls).forEach(key => {
      const control = this.categoryForm.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched();
      } else {
        control?.markAsTouched();
      }
    });
  }

  // Template helper methods
  getFieldControl(fieldName: string): AbstractControl | null {
    return this.categoryForm.get(fieldName);
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.getFieldControl(fieldName);
    return control ? control.invalid && control.touched : false;
  }

  getFieldError(fieldName: string): string {
    const control = this.getFieldControl(fieldName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'This field is required';
    if (control.errors['minlength']) return `Minimum length is ${control.errors['minlength'].requiredLength} characters`;
    if (control.errors['maxlength']) return `Maximum length is ${control.errors['maxlength'].requiredLength} characters`;
    
    return 'Invalid input';
  }

  getParentCategories(): Category[] {
    return this.parentCategories.filter(cat => cat.isActive && !cat.isSystem);
  }

  getCategoryPath(categoryId: string): string {
    const category = this.parentCategories.find(cat => cat._id === categoryId);
    if (category && category.path && Array.isArray(category.path) && category.path.length > 0) {
      return category.path.join(' > ') + ' > ' + category.name;
    }
    return category ? category.name : '';
  }

  getPreviewStyle(): any {
    const color = this.getFieldControl('color')?.value || '#667eea';
    return {
      'background-color': color,
      'color': this.getContrastColor(color)
    };
  }

  getIconDescription(icon: string): string {
    return this.iconDescriptions[icon] || 'Unknown Icon';
  }

  getContrastColor(hexColor: string): string {
    // Simple contrast calculation
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  }

  canSubmit(): boolean {
    return this.categoryForm.valid && !this.isSubmitting;
  }

  // Computed properties for loading states
  get isLoading(): boolean {
    return this.isFormLoading || this.isParentCategoriesLoading;
  }
}