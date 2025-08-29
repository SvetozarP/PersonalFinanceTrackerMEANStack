import mongoose, { Schema } from 'mongoose';
import {
  IBudget,
  IBudgetModel,
  ICategoryAllocation,
} from '../interfaces/budget.interface';

// Budget Schema
const budgetSchema = new Schema<IBudget>(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, 'Budget name is required'],
      trim: true,
      maxlength: [200, 'Budget name must be less than 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Budget description must be less than 1000 characters'],
    },

    // Budget Period
    period: {
      type: String,
      enum: {
        values: ['monthly', 'yearly', 'custom'],
        message: 'Budget period must be monthly, yearly, or custom',
      },
      required: [true, 'Budget period is required'],
      default: 'monthly',
    },

    // Time Range
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      index: true,
    },

    // Total Budget Amount
    totalAmount: {
      type: Number,
      required: [true, 'Total budget amount is required'],
      min: [0.01, 'Total budget amount must be greater than 0'],
      set: (val: number) => Math.round(val * 100) / 100, // Round to 2 decimal places
    },

    // Currency
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      trim: true,
      uppercase: true,
      minlength: [3, 'Currency code must be 3 characters'],
      maxlength: [3, 'Currency code must be 3 characters'],
      default: 'USD',
    },

    // Category Allocations
    categoryAllocations: [
      {
        categoryId: {
          type: Schema.Types.ObjectId,
          ref: 'Category',
          required: [true, 'Category ID is required'],
        },
        allocatedAmount: {
          type: Number,
          required: [true, 'Allocated amount is required'],
          min: [0, 'Allocated amount cannot be negative'],
          set: (val: number) => Math.round(val * 100) / 100,
        },
        isFlexible: {
          type: Boolean,
          default: false, // Whether this category can exceed its allocation
        },
        priority: {
          type: Number,
          default: 1,
          min: [1, 'Priority must be at least 1'],
          max: [10, 'Priority cannot exceed 10'],
        },
      },
    ],

    // Budget Status
    status: {
      type: String,
      enum: {
        values: ['active', 'paused', 'completed', 'archived'],
        message: 'Invalid budget status',
      },
      default: 'active',
      index: true,
    },

    // Alert Settings
    alertThreshold: {
      type: Number,
      min: [0, 'Alert threshold cannot be negative'],
      max: [100, 'Alert threshold cannot exceed 100%'],
      default: 80, // Alert when 80% of budget is used
    },

    // User and Metadata
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Auto-adjustment settings
    autoAdjust: {
      type: Boolean,
      default: false, // Whether to automatically adjust allocations
    },

    // Rollover settings
    allowRollover: {
      type: Boolean,
      default: false, // Whether unused amounts can roll over to next period
    },

    rolloverAmount: {
      type: Number,
      default: 0,
      min: [0, 'Rollover amount cannot be negative'],
      set: (val: number) => Math.round(val * 100) / 100,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for unique budget names per user and period
budgetSchema.index(
  { userId: 1, name: 1, startDate: 1, endDate: 1 },
  { unique: true }
);

// Indexes for efficient queries
budgetSchema.index({ userId: 1, status: 1 });
budgetSchema.index({ userId: 1, startDate: 1, endDate: 1 });
budgetSchema.index({ userId: 1, period: 1 });
budgetSchema.index({ 'categoryAllocations.categoryId': 1 });

// Virtual for budget duration in days
budgetSchema.virtual('durationDays').get(function () {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(
      this.endDate.getTime() - this.startDate.getTime()
    );
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for remaining days
budgetSchema.virtual('remainingDays').get(function () {
  if (this.endDate) {
    const now = new Date();
    const diffTime = this.endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for progress percentage
budgetSchema.virtual('progressPercentage').get(function () {
  if (this.totalAmount > 0) {
    return Math.round(((this.spentAmount || 0) / this.totalAmount) * 100);
  }
  return 0;
});

// Virtual for spent amount (will be calculated by service)
budgetSchema.virtual('spentAmount').get(function () {
  return 0; // This will be populated by the service layer
});

// Virtual for remaining amount
budgetSchema.virtual('remainingAmount').get(function () {
  return this.totalAmount - (this.spentAmount || 0);
});

// Virtual for isOverBudget
budgetSchema.virtual('isOverBudget').get(function () {
  return (this.spentAmount || 0) > this.totalAmount;
});

// Pre-save middleware to validate dates
budgetSchema.pre('save', function (next) {
  if (this.startDate && this.endDate && this.startDate >= this.endDate) {
    return next(new Error('Start date must be before end date'));
  }

  // Validate that category allocations don't exceed total amount
  const totalAllocated = this.categoryAllocations.reduce(
    (sum, allocation) => sum + allocation.allocatedAmount,
    0
  );

  if (totalAllocated > this.totalAmount) {
    return next(
      new Error('Total allocated amount cannot exceed total budget amount')
    );
  }

  next();
});

// Static method to find active budgets for a user
budgetSchema.statics.findActiveBudgets = function (
  userId: string,
  date?: Date
) {
  const queryDate = date || new Date();
  return this.find({
    userId,
    status: 'active',
    startDate: { $lte: queryDate },
    endDate: { $gte: queryDate },
  });
};

// Instance method to check if budget is active for a given date
budgetSchema.methods.isActiveForDate = function (date: Date) {
  return (
    this.status === 'active' && this.startDate <= date && this.endDate >= date
  );
};

// Instance method to get category allocation
budgetSchema.methods.getCategoryAllocation = function (categoryId: string) {
  return this.categoryAllocations.find(
    (allocation: ICategoryAllocation) =>
      allocation.categoryId.toString() === categoryId
  );
};

// Instance method to update category allocation
budgetSchema.methods.updateCategoryAllocation = function (
  categoryId: string,
  newAmount: number
) {
  const allocation = this.getCategoryAllocation(categoryId);
  if (allocation) {
    allocation.allocatedAmount = newAmount;
    return true;
  }
  return false;
};

const Budget = mongoose.model<IBudget, IBudgetModel>('Budget', budgetSchema);

export default Budget;
