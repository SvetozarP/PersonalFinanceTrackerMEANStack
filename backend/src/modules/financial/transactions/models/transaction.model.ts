import mongoose, { Schema } from 'mongoose';
import {
  ITransaction,
  ITransactionModel,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  RecurrencePattern,
} from '../interfaces/transaction.interface';
import uniqueValidator from 'mongoose-unique-validator';

// Transaction Schema
const transactionSchema = new Schema<ITransaction>(
  {
    // Basic Information
    title: {
      type: String,
      required: [true, 'Transaction title is required'],
      trim: true,
      maxlength: [200, 'Transaction title must be less than 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [
        1000,
        'Transaction description must be less than 1000 characters',
      ],
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
      min: [0.01, 'Transaction amount must be greater than 0'],
      set: (val: number) => Math.round(val * 100) / 100, // Round to 2 decimal places
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      trim: true,
      uppercase: true,
      minlength: [3, 'Currency code must be 3 characters'],
      maxlength: [3, 'Currency code must be 3 characters'],
      default: 'USD',
    },
    type: {
      type: String,
      enum: {
        values: Object.values(TransactionType),
        message: 'Invalid transaction type',
      },
      required: [true, 'Transaction type is required'],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(TransactionStatus),
        message: 'Invalid transaction status',
      },
      default: TransactionStatus.COMPLETED,
    },

    // Categorization
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    subcategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [50, 'Tag must be less than 50 characters'],
      },
    ],

    // Timing
    date: {
      type: Date,
      required: [true, 'Transaction date is required'],
      default: Date.now,
      index: true,
    },
    time: {
      type: String,
      trim: true,
      match: [
        /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
        'Invalid time format (HH:MM)',
      ],
    },
    timezone: {
      type: String,
      required: [true, 'Timezone is required'],
      default: 'UTC',
    },

    // Location and Context
    location: {
      name: {
        type: String,
        trim: true,
        maxlength: [200, 'Location name must be less than 200 characters'],
      },
      address: {
        type: String,
        trim: true,
        maxlength: [500, 'Address must be less than 500 characters'],
      },
      coordinates: {
        latitude: {
          type: Number,
          min: [-90, 'Latitude must be between -90 and 90'],
          max: [90, 'Latitude must be between -90 and 90'],
        },
        longitude: {
          type: Number,
          min: [-180, 'Longitude must be between -180 and 180'],
          max: [180, 'Longitude must be between -180 and 180'],
        },
      },
    },

    // Payment Details
    paymentMethod: {
      type: String,
      enum: {
        values: Object.values(PaymentMethod),
        message: 'Invalid payment method',
      },
      required: [true, 'Payment method is required'],
    },
    paymentReference: {
      type: String,
      trim: true,
      maxlength: [100, 'Payment reference must be less than 100 characters'],
    },
    merchantName: {
      type: String,
      trim: true,
      maxlength: [200, 'Merchant name must be less than 200 characters'],
    },
    merchantId: {
      type: String,
      trim: true,
      maxlength: [100, 'Merchant ID must be less than 100 characters'],
    },

    // Financial Details
    originalAmount: {
      type: Number,
      min: [0.01, 'Original amount must be greater than 0'],
      set: (val: number) => Math.round(val * 100) / 100,
    },
    originalCurrency: {
      type: String,
      trim: true,
      uppercase: true,
      minlength: [3, 'Original currency code must be 3 characters'],
      maxlength: [3, 'Original currency code must be 3 characters'],
    },
    exchangeRate: {
      type: Number,
      min: [0.000001, 'Exchange rate must be greater than 0'],
    },
    fees: {
      type: Number,
      min: [0, 'Fees cannot be negative'],
      set: (val: number) => Math.round(val * 100) / 100,
    },
    tax: {
      type: Number,
      min: [0, 'Tax cannot be negative'],
      set: (val: number) => Math.round(val * 100) / 100,
    },

    // Recurrence
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrencePattern: {
      type: String,
      enum: {
        values: Object.values(RecurrencePattern),
        message: 'Invalid recurrence pattern',
      },
      default: RecurrencePattern.NONE,
    },
    recurrenceInterval: {
      type: Number,
      min: [1, 'Recurrence interval must be at least 1'],
    },
    recurrenceEndDate: {
      type: Date,
      validate: {
        validator: function (this: ITransaction, value: Date) {
          if (this.isRecurring && value) {
            return value > this.date;
          }
          return true;
        },
        message: 'Recurrence end date must be after transaction date',
      },
    },
    nextOccurrence: {
      type: Date,
      index: true,
    },
    parentTransactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
    },

    // Attachments and Notes
    attachments: [
      {
        filename: {
          type: String,
          required: true,
          trim: true,
        },
        originalName: {
          type: String,
          required: true,
          trim: true,
        },
        mimeType: {
          type: String,
          required: true,
          trim: true,
        },
        size: {
          type: Number,
          required: true,
          min: [0, 'File size cannot be negative'],
        },
        url: {
          type: String,
          required: true,
          trim: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes must be less than 2000 characters'],
    },

    // Metadata
    source: {
      type: String,
      required: [true, 'Transaction source is required'],
      enum: {
        values: ['manual', 'import', 'api', 'bank_sync'],
        message: 'Invalid transaction source',
      },
      default: 'manual',
    },
    externalId: {
      type: String,
      trim: true,
      maxlength: [100, 'External ID must be less than 100 characters'],
    },
    lastSyncedAt: {
      type: Date,
    },

    // User and Ownership
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account', // Will be created in Phase 4
      required: [true, 'Account ID is required'],
      index: true,
    },

    // Audit Fields
    deletedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for efficient querying
transactionSchema.index({ userId: 1, accountId: 1, date: -1 });
transactionSchema.index({ userId: 1, categoryId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });
transactionSchema.index({ userId: 1, status: 1, date: -1 });
transactionSchema.index({ userId: 1, isRecurring: 1, nextOccurrence: 1 });
transactionSchema.index({ userId: 1, tags: 1, date: -1 });
transactionSchema.index({ userId: 1, merchantName: 1, date: -1 });

// Text index for search functionality
transactionSchema.index({
  title: 'text',
  description: 'text',
  merchantName: 'text',
  notes: 'text',
  tags: 'text',
});

// Virtual for full category path
transactionSchema.virtual('fullCategoryPath', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true,
  get: function (this: ITransaction) {
    if (this.populated('fullCategoryPath')) {
      return 'Category Loaded';
    }
    return 'Unknown Category';
  },
});

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function (this: ITransaction) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency,
  }).format(this.amount);
});

// Virtual for days since transaction
transactionSchema.virtual('daysSinceTransaction').get(function (
  this: ITransaction
) {
  const now = new Date();
  const transactionDate = new Date(this.date);
  const diffTime = Math.abs(now.getTime() - transactionDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for total amount including fees and tax
transactionSchema.virtual('totalAmount').get(function (this: ITransaction) {
  let total = this.amount;
  if (this.fees) total += this.fees;
  if (this.tax) total += this.tax;
  return Math.round(total * 100) / 100;
});

// Pre-save middleware for validation and computed fields
transactionSchema.pre('save', function (this: ITransaction, next: () => void) {
  // Validate subcategory belongs to the same user and is a child of the main category
  if (this.subcategoryId && this.categoryId) {
    // This validation will be handled in the service layer for better error handling
  }

  // Set next occurrence for recurring transactions
  if (this.isRecurring && this.recurrencePattern !== RecurrencePattern.NONE) {
    this.nextOccurrence = calculateNextOccurrence(
      this.date,
      this.recurrencePattern,
      this.recurrenceInterval
    );
  }

  next();
});

// Pre-find middleware to exclude deleted transactions by default
transactionSchema.pre('find', function () {
  this.where({ isDeleted: false });
});

transactionSchema.pre('findOne', function () {
  this.where({ isDeleted: false });
});

// Static method to get transactions by date range
transactionSchema.statics.getTransactionsByDateRange = async function (
  userId: string,
  accountId: string,
  startDate: Date,
  endDate: Date
): Promise<ITransaction[]> {
  return this.find({
    userId,
    accountId,
    date: { $gte: startDate, $lte: endDate },
    isDeleted: false,
  })
    .populate('categoryId', 'name color icon')
    .populate('subcategoryId', 'name color icon')
    .sort({ date: -1, createdAt: -1 });
};

// Static method to get transaction statistics
transactionSchema.statics.getTransactionStats = async function (
  userId: string,
  accountId: string,
  startDate: Date,
  endDate: Date
): Promise<
  {
    type: string;
    category: {
      id: string;
      name: string;
      color: string;
      icon: string;
    };
    count: number;
    totalAmount: number;
    avgAmount: number;
    minAmount: number;
    maxAmount: number;
  }[]
> {
  const pipeline = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        accountId: new mongoose.Types.ObjectId(accountId),
        date: { $gte: startDate, $lte: endDate },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: {
          type: '$type',
          categoryId: '$categoryId',
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' },
        minAmount: { $min: '$amount' },
        maxAmount: { $max: '$amount' },
      },
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id.categoryId',
        foreignField: '_id',
        as: 'category',
      },
    },
    {
      $unwind: '$category',
    },
    {
      $project: {
        type: '$_id.type',
        category: {
          id: '$category._id',
          name: '$category.name',
          color: '$category.color',
          icon: '$category.icon',
        },
        count: 1,
        totalAmount: 1,
        avgAmount: 1,
        minAmount: 1,
        maxAmount: 1,
      },
    },
  ];

  return this.aggregate(pipeline);
};

// Static method to get recurring transactions
transactionSchema.statics.getRecurringTransactions = async function (
  userId: string
): Promise<ITransaction[]> {
  return this.find({
    userId,
    isRecurring: true,
    isDeleted: false,
  })
    .populate('categoryId', 'name color icon')
    .sort({ nextOccurrence: 1 });
};

// Static method to create recurring series
transactionSchema.statics.createRecurringSeries = async function (
  transactionData: Partial<ITransaction>,
  pattern: RecurrencePattern,
  endDate: Date
): Promise<ITransaction[]> {
  const transactions: ITransaction[] = [];
  let currentDate = transactionData.date
    ? new Date(transactionData.date)
    : new Date();

  while (currentDate <= endDate) {
    const transaction = new this({
      ...transactionData,
      date: new Date(currentDate),
      nextOccurrence: calculateNextOccurrence(currentDate, pattern),
    });

    transactions.push(transaction);
    currentDate = calculateNextOccurrence(currentDate, pattern);
  }

  return this.insertMany(transactions);
};

// Helper function to calculate next occurrence
function calculateNextOccurrence(
  fromDate: Date,
  pattern: RecurrencePattern,
  interval: number = 1
): Date {
  const nextDate = new Date(fromDate);

  switch (pattern) {
    case RecurrencePattern.DAILY:
      nextDate.setDate(nextDate.getDate() + interval);
      break;
    case RecurrencePattern.WEEKLY:
      nextDate.setDate(nextDate.getDate() + 7 * interval);
      break;
    case RecurrencePattern.BIWEEKLY:
      nextDate.setDate(nextDate.getDate() + 14 * interval);
      break;
    case RecurrencePattern.MONTHLY:
      nextDate.setMonth(nextDate.getMonth() + interval);
      break;
    case RecurrencePattern.QUARTERLY:
      nextDate.setMonth(nextDate.getMonth() + 3 * interval);
      break;
    case RecurrencePattern.YEARLY:
      nextDate.setFullYear(nextDate.getFullYear() + interval);
      break;
    default:
      return nextDate;
  }

  return nextDate;
}

// Apply unique validator plugin
transactionSchema.plugin(uniqueValidator, {
  message: 'Error, expected {PATH} to be unique.',
});

export const Transaction = mongoose.model<ITransaction, ITransactionModel>(
  'Transaction',
  transactionSchema
);
