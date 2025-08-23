import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Subject, takeUntil, switchMap, of } from 'rxjs';
import { Category } from '../../../../core/models/financial.model';
import { CategoryService } from '../../../../core/services/category.service';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule
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

  categoryForm!: FormGroup;
  categories: Category[] = [];
  isEditMode = false;
  categoryId: string | null = null;
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;

  // Form field names for easy access
  readonly formFields = {
    name: 'name',
    description: 'description',
    color: 'color',
    icon: 'icon',
    parentId: 'parentId',
    isActive: 'isActive'
  };

  // Predefined color options
  readonly colorOptions = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe',
    '#43e97b', '#38f9d7', '#fa709a', '#fee140', '#a8edea', '#fed6e3',
    '#ffecd2', '#fcb69f', '#ff9a9e', '#fecfef', '#fecfef', '#a18cd1',
    '#fbc2eb', '#a6c0fe', '#d299c2', '#fef9d7', '#ffecd2', '#fcb69f'
  ];

  // Predefined icon options
  readonly iconOptions = [
    '🏠', '🚗', '🍔', '🛒', '💊', '🎓', '��', '��', '✈️', '��️',
    '🏥', '🏦', '🎮', '📱', '💻', '��', '🎨', '��', '⚽', '🏀',
    '💰', '💳', '��', '��', '��', '⭐', '🔥', '💎', '🌱', '🌍',
    '��', '��', '��', '☕', '🍕', '🍣', '🍜', '🥗', '🍰', '🍺'
  ];

  ngOnInit(): void {
    this.initializeForm();
    this.loadCategories();
    this.checkEditMode();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.categoryForm = this.fb.group({
      [this.formFields.name]: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      [this.formFields.description]: ['', [Validators.maxLength(200)]],
      [this.formFields.color]: ['#667eea', [Validators.required]],
      [this.formFields.icon]: ['🏷️', [Validators.required]],
      [this.formFields.parentId]: [''],
      [this.formFields.isActive]: [true, [Validators.required]]
    });
  }

  private checkEditMode(): void {
    this.route.params.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        const id = params['id'];
        if (id && id !== 'new') {
          this.isEditMode = true;
          this.categoryId = id;
          return this.categoryService.getCategoryById(id);
        }
        return of(null);
      })
    ).subscribe({
      next: (category) => {
        if (category) {
          this.populateForm(category);
        }
      },
      error: (error) => {
        console.error('Error loading category:', error);
        this.error = 'Failed to load category';
      }
    });
  }

  private populateForm(category: Category): void {
    this.categoryForm.patchValue({
      [this.formFields.name]: category.name,
      [this.formFields.description]: category.description,
      [this.formFields.color]: category.color || '#667eea',
      [this.formFields.icon]: category.icon || '🏷️',
      [this.formFields.parentId]: category.parentId || '',
      [this.formFields.isActive]: category.isActive
    });
  }

  private loadCategories(): void {
    this.categoryService.getUserCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.error = 'Failed to load categories';
        }
      });
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    const formValue = this.categoryForm.value;
    
    // Prepare category data
    const categoryData: Partial<Category> = {
      name: formValue[this.formFields.name],
      description: formValue[this.formFields.description] || undefined,
      color: formValue[this.formFields.color],
      icon: formValue[this.formFields.icon],
      parentId: formValue[this.formFields.parentId] || undefined,
      isActive: formValue[this.formFields.isActive]
    };

    const request$ = this.isEditMode && this.categoryId ?
      this.categoryService.updateCategory(this.categoryId, categoryData) :
      this.categoryService.createCategory(categoryData);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (category) => {
        this.isSubmitting = false;
        this.router.navigate(['/financial/categories']);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.error = 'Failed to save category';
        console.error('Error saving category:', error);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/financial/categories']);
  }

  onColorSelect(color: string): void {
    this.categoryForm.patchValue({ [this.formFields.color]: color });
  }

  onIconSelect(icon: string): void {
    this.categoryForm.patchValue({ [this.formFields.icon]: icon });
  }

  onParentCategoryChange(parentId: string): void {
    // Update form validation based on parent selection
    if (parentId) {
      // If parent is selected, ensure it's not a system category or inactive
      const parentCategory = this.categories.find(c => c._id === parentId);
      if (parentCategory && (!parentCategory.isActive || parentCategory.isSystem)) {
        this.categoryForm.patchValue({ [this.formFields.parentId]: '' });
        this.error = 'Cannot select inactive or system categories as parent';
        setTimeout(() => this.error = null, 3000);
      }
    }
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

  // Helper methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.categoryForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.categoryForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return 'This field is required';
      if (field.errors['minlength']) return `Minimum length is ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['maxlength']) return `Maximum length is ${field.errors['maxlength'].requiredLength} characters`;
    }
    return '';
  }

  getFieldControl(fieldName: string): AbstractControl | null {
    return this.categoryForm.get(fieldName);
  }

  // Category hierarchy methods
  getParentCategories(): Category[] {
    // Return only active, non-system categories that can be parents
    return this.categories.filter(cat => 
      cat.isActive && !cat.isSystem && cat._id !== this.categoryId
    );
  }

  getCategoryPath(categoryId: string): string {
    const category = this.categories.find(c => c._id === categoryId);
    if (!category) return '';
    
    if (!category.parentId) return category.name;
    
    const parent = this.categories.find(c => c._id === category.parentId);
    if (!parent) return category.name;
    
    return `${this.getCategoryPath(category.parentId)} > ${category.name}`;
  }

  // Color and icon preview methods
  getPreviewStyle(): any {
    const color = this.categoryForm.get(this.formFields.color)?.value || '#667eea';
    const icon = this.categoryForm.get(this.formFields.icon)?.value || '��️';
    
    return {
      backgroundColor: color,
      color: this.getContrastColor(color)
    };
  }

  getContrastColor(hexColor: string): string {
    // Convert hex to RGB and calculate luminance
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  // Form validation helpers
  isFormValid(): boolean {
    return this.categoryForm.valid && !this.isSubmitting;
  }

  canSubmit(): boolean {
    return this.isFormValid() && this.categoryForm.dirty;
  }

  // Reset form to initial values
  resetForm(): void {
    if (this.isEditMode) {
      this.populateForm(this.categories.find(c => c._id === this.categoryId) as Category);
    } else {
      this.categoryForm.reset({
        [this.formFields.name]: '',
        [this.formFields.description]: '',
        [this.formFields.color]: '#667eea',
        [this.formFields.icon]: '🏷️',
        [this.formFields.parentId]: '',
        [this.formFields.isActive]: true
      });
    }
    this.categoryForm.markAsUntouched();
    this.error = null;
  }
}