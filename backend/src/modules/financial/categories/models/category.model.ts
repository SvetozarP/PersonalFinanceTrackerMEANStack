import mongoose, { Schema } from 'mongoose';
import { ICategory, ICategoryModel } from '../interfaces/category.interface';

// Category Schema
const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [100, 'Category name must be less than 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Category description must be less than 500 characters'],
    },
    color: {
      type: String,
      trim: true,
      match: [
        /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
        'Color must be a valid hex color code',
      ],
      default: '#3B82F6', // Default blue color
    },
    icon: {
      type: String,
      trim: true,
      maxlength: [50, 'Icon name must be less than 50 characters'],
      default: 'folder', // Default icon
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    path: {
      type: [String],
      default: [],
    },
    level: {
      type: Number,
      default: 0,
      min: [0, 'Level cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for unique category names per user and parent
categorySchema.index({ userId: 1, parentId: 1, name: 1 }, { unique: true });

// Index for efficient hierarchical queries
categorySchema.index({ parentId: 1, path: 1 });
categorySchema.index({ userId: 1, level: 1 });
categorySchema.index({ userId: 1, parentId: 1 });

// Enhanced compound indexes for better performance
categorySchema.index({ userId: 1, isActive: 1, level: 1 });
categorySchema.index({ userId: 1, isActive: 1, parentId: 1 });
categorySchema.index({ userId: 1, isSystem: 1, isActive: 1 });
categorySchema.index({ userId: 1, name: 1, isActive: 1 });

// Indexes for path-based queries (hierarchical navigation)
categorySchema.index({ userId: 1, path: 1, isActive: 1 });
categorySchema.index({ userId: 1, level: 1, isActive: 1, name: 1 });

// Virtual for full path
categorySchema.virtual('fullPath').get(function () {
  // Add null check for path field
  if (!this.path || !Array.isArray(this.path)) {
    return this.name || 'Unknown Category';
  }
  const pathArray = [...this.path];
  if (this.name) {
    pathArray.push(this.name);
  }
  return pathArray.join(' > ');
});

// Virtual for children count
categorySchema.virtual('childrenCount', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentId',
  count: true,
});

// Virtual for children
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentId',
  justOne: false,
});

// Virtual for parent
categorySchema.virtual('parent', {
  ref: 'Category',
  localField: 'parentId',
  foreignField: '_id',
  justOne: true,
});

// Pre-save middleware to validate uniqueness and update path and level
categorySchema.pre(
  'save',
  async function (this: ICategory, next: (error?: Error) => void) {
    try {
      // Check uniqueness before saving
      const CategoryModel = this.constructor as mongoose.Model<ICategory>;
      const existingCategory = await CategoryModel.findOne({
        userId: this.userId,
        parentId: this.parentId,
        name: this.name,
        _id: { $ne: this._id }, // Exclude current document when updating
      });

      if (existingCategory) {
        const error = new Error(
          'Category name must be unique within the same parent and user'
        );
        (error as any).name = 'ValidationError';
        return next(error);
      }

      // Update path and level if parentId changed
      if (this.isModified('parentId')) {
        if (this.parentId) {
          // Get parent category to build path
          const parent = await CategoryModel.findById(this.parentId);
          if (parent) {
            this.path = [...parent.path, parent.name];
            this.level = parent.level + 1;
          } else {
            // Invalid parent, reset to root
            this.parentId = undefined;
            this.path = [];
            this.level = 0;
          }
        } else {
          // Root directory
          this.path = [];
          this.level = 0;
        }
      }
      next();
    } catch (error) {
      next(error as Error);
    }
  }
);

// Pre-deleteOne middleware to handle children when category is deleted
categorySchema.pre(
  'deleteOne',
  { document: true, query: true },
  async function (this: any, next: (error?: Error) => void) {
    try {
      let categoryId: mongoose.Types.ObjectId;

      if (this._id) {
        // Document-level deletion
        categoryId = this._id;
      } else if (this.getQuery && this.getQuery()._id) {
        // Query-level deletion
        categoryId = this.getQuery()._id;
      } else {
        return next();
      }

      // Move children to parent or make them root categories
      const CategoryModel = mongoose.model('Category');
      const children = await CategoryModel.find({ parentId: categoryId });
      if (children.length === 0) return next();

      // Get the category being deleted to determine its parent
      const category = await CategoryModel.findById(categoryId);
      if (!category) return next();
      for (const child of children) {
        if (category.parentId) {
          // Move to grandparent
          child.parentId = category.parentId;
        } else {
          // Make root category
          child.parentId = undefined;
          child.path = [];
          child.level = 0;
        }
        await child.save();
      }
      next();
    } catch (error) {
      next(error as Error);
    }
  }
);

// Static method to get category tree
categorySchema.statics.getCategoryTree = async function (userId: string) {
  const categories = await this.find({ userId, isActive: true })
    .populate('children')
    .sort({ level: 1, name: 1 });

  const buildTree = (
    items: ICategory[],
    parentId: mongoose.Types.ObjectId | null = null
  ): ICategory[] => {
    return items
      .filter(item =>
        parentId === null
          ? !item.parentId
          : item.parentId?.toString() === parentId.toString()
      )
      .map(item => {
        const itemObj = item.toObject();
        return {
          ...itemObj,
          children: buildTree(items, item._id as mongoose.Types.ObjectId),
        } as ICategory;
      });
  };

  return buildTree(categories);
};

// Static method to get category path
categorySchema.statics.getCategoryPath = async function (categoryId: string) {
  const category = await this.findById(categoryId);
  if (!category) return null;

  const categoryObj = category.toObject({ virtuals: true });
  return {
    id: categoryObj._id,
    name: categoryObj.name,
    path: categoryObj.path,
    fullPath: categoryObj.fullPath,
  };
};

export const Category = mongoose.model<ICategory, ICategoryModel>(
  'Category',
  categorySchema
);
