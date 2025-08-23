import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Category } from '../../../../core/models/financial.model';
import { CategoryService } from '../../../../core/services/category.service';

interface TreeNode {
  category: Category;
  children: TreeNode[];
  isExpanded: boolean;
  level: number;
}

@Component({
  selector: 'app-category-tree',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './category-tree.html',
  styleUrls: ['./category-tree.scss']
})
export class CategoryTreeComponent implements OnInit, OnDestroy {
  @Input() showActions: boolean = true;
  @Input() selectable: boolean = false;
  @Input() multiSelect: boolean = false;
  @Input() selectedCategories: string[] = [];
  @Input() maxDepth: number = 5;
  
  @Output() categorySelected = new EventEmitter<Category>();
  @Output() categoryEdited = new EventEmitter<Category>();
  @Output() categoryDeleted = new EventEmitter<Category>();
  @Output() categoryToggled = new EventEmitter<{ category: Category; isExpanded: boolean }>();

  private destroy$ = new Subject<void>();
  private categoryService = inject(CategoryService);

  // Data
  categories: Category[] = [];
  treeNodes: TreeNode[] = [];
  
  // UI State
  isLoading: boolean = false;
  searchTerm: string = '';
  showInactive: boolean = false;
  sortBy: 'name' | 'level' | 'transactionCount' = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  // Drag and Drop
  draggedCategory: Category | null = null;
  dropTarget: Category | null = null;

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCategories(): void {
    this.isLoading = true;

    this.categoryService.getUserCategories().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (categories) => {
        this.categories = categories || [];
        this.buildTree();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.isLoading = false;
      }
    });
  }

  private buildTree(): void {
    // Create a map for quick lookup
    const categoryMap = new Map<string, Category>();
    this.categories.forEach(cat => categoryMap.set(cat._id, cat));

    // Build tree structure
    this.treeNodes = this.categories
      .filter(cat => !cat.parentId) // Root categories
      .map(cat => this.buildTreeNode(cat, categoryMap, 0))
      .sort((a, b) => this.sortCategories(a.category, b.category));
  }

  private buildTreeNode(category: Category, categoryMap: Map<string, Category>, level: number): TreeNode {
    const children = this.categories
      .filter(cat => cat.parentId === category._id)
      .map(cat => this.buildTreeNode(cat, categoryMap, level + 1))
      .sort((a, b) => this.sortCategories(a.category, b.category));

    return {
      category,
      children,
      isExpanded: level < 2, // Auto-expand first two levels
      level
    };
  }

  private sortCategories(a: Category, b: Category): number {
    const order = this.sortOrder === 'asc' ? 1 : -1;
    
    switch (this.sortBy) {
      case 'name':
        return a.name.localeCompare(b.name) * order;
      case 'level':
        return (a.level - b.level) * order;
      case 'transactionCount':
        // This would need transaction data to implement properly
        return a.name.localeCompare(b.name) * order;
      default:
        return a.name.localeCompare(b.name) * order;
    }
  }

  onCategoryClick(category: Category): void {
    if (this.selectable) {
      this.toggleCategorySelection(category);
    }
    this.categorySelected.emit(category);
  }

  onCategoryToggle(node: TreeNode): void {
    node.isExpanded = !node.isExpanded;
    this.categoryToggled.emit({ 
      category: node.category, 
      isExpanded: node.isExpanded 
    });
  }

  onCategoryEdit(category: Category, event: Event): void {
    event.stopPropagation();
    this.categoryEdited.emit(category);
  }

  onCategoryDelete(category: Category, event: Event): void {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete "${category.name}"? This will also delete all subcategories.`)) {
      this.categoryDeleted.emit(category);
    }
  }

  onCategoryAdd(parentId?: string): void {
    // This would typically open a modal or navigate to category form
    console.log('Add category under:', parentId);
  }

  private toggleCategorySelection(category: Category): void {
    if (this.multiSelect) {
      const index = this.selectedCategories.indexOf(category._id);
      if (index > -1) {
        this.selectedCategories.splice(index, 1);
      } else {
        this.selectedCategories.push(category._id);
      }
    } else {
      this.selectedCategories = [category._id];
    }
  }

  isCategorySelected(categoryId: string): boolean {
    return this.selectedCategories.includes(categoryId);
  }

  onSearchChange(): void {
    // Implement search functionality
    this.filterCategories();
  }

  private filterCategories(): void {
    if (!this.searchTerm.trim()) {
      this.buildTree();
      return;
    }

    const filteredCategories = this.categories.filter(cat => 
      cat.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      cat.description?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );

    // Rebuild tree with filtered categories
    this.treeNodes = this.buildFilteredTree(filteredCategories);
  }

  private buildFilteredTree(filteredCategories: Category[]): TreeNode[] {
    const categoryMap = new Map<string, Category>();
    filteredCategories.forEach(cat => categoryMap.set(cat._id, cat));

    return filteredCategories
      .filter(cat => !cat.parentId || filteredCategories.some(fc => fc._id === cat.parentId))
      .map(cat => this.buildTreeNode(cat, categoryMap, 0))
      .sort((a, b) => this.sortCategories(a.category, b.category));
  }

  onSortChange(): void {
    this.buildTree();
  }

  onShowInactiveChange(): void {
    this.loadCategories();
  }

  // Drag and Drop methods
  onDragStart(event: DragEvent, category: Category): void {
    this.draggedCategory = category;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', category._id);
    }
  }

  onDragOver(event: DragEvent, category: Category): void {
    event.preventDefault();
    if (this.draggedCategory && this.draggedCategory._id !== category._id) {
      this.dropTarget = category;
    }
  }

  onDragLeave(event: DragEvent): void {
    this.dropTarget = null;
  }

  onDrop(event: DragEvent, targetCategory: Category): void {
    event.preventDefault();
    if (this.draggedCategory && this.draggedCategory._id !== targetCategory._id) {
      this.moveCategory(this.draggedCategory, targetCategory);
    }
    this.draggedCategory = null;
    this.dropTarget = null;
  }

  private moveCategory(category: Category, newParent: Category): void {
    // This would typically call the category service to update the parent
    console.log(`Moving ${category.name} under ${newParent.name}`);
  }

  getCategoryIcon(category: Category): string {
    return category.icon || 'fas fa-folder';
  }

  getCategoryColor(category: Category): string {
    return category.color || '#6c757d';
  }

  canDropOn(category: Category): boolean {
    if (!this.draggedCategory) return false;
    if (this.draggedCategory._id === category._id) return false;
    
    // Prevent dropping on itself or its descendants
    return !this.isDescendant(this.draggedCategory._id, category._id);
  }

  private isDescendant(parentId: string, childId: string): boolean {
    const parent = this.categories.find(c => c._id === parentId);
    if (!parent) return false;
    
    const children = this.categories.filter(c => c.parentId === parentId);
    return children.some(child => 
      child._id === childId || this.isDescendant(child._id, childId)
    );
  }

  getFilteredCategories(): TreeNode[] {
    if (!this.searchTerm.trim()) {
      return this.treeNodes;
    }
    return this.treeNodes.filter(node => 
      this.matchesSearch(node, this.searchTerm.toLowerCase())
    );
  }

  private matchesSearch(node: TreeNode, searchTerm: string): boolean {
    const category = node.category;
    if (category.name.toLowerCase().includes(searchTerm) ||
        category.description?.toLowerCase().includes(searchTerm)) {
      return true;
    }
    
    return node.children.some(child => this.matchesSearch(child, searchTerm));
  }
}