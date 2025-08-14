import mongoose, { Document, Model } from 'mongoose';

// Transaction type enum
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
  ADJUSTMENT = 'adjustment',
}

// Transaction status enum
export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

// Payment method enum
export enum PaymentMethod {
  CASH = 'cash',
  DEBIT_CARD = 'debit_card',
  CREDIT_CARD = 'credit_card',
  BANK_TRANSFER = 'bank_transfer',
  CHECK = 'check',
  DIGITAL_WALLET = 'digital_wallet',
  CRYPTO = 'crypto',
  OTHER = 'other',
}

// Recurrence pattern enum
export enum RecurrencePattern {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  CUSTOM = 'custom',
}

// Transaction interface
export interface ITransaction extends Document {
  // Basic information
  title: string;
  description?: string;
  amount: number;
  currency: string;
  type: TransactionType;
  status: TransactionStatus;

  // Categorization
  categoryId: mongoose.Types.ObjectId;
  subcategoryId?: mongoose.Types.ObjectId;
  tags: string[];

  // Timing
  date: Date;
  time?: string; // Optional - time of day
  timezone: string;

  // Location and Context
  location?: {
    name?: string;
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };

  // Payment details
  paymentMethod: PaymentMethod;
  paymentReference?: string; // Optional - transaction ID, receipt, etc.
  merchantName?: string; // Optional - name of the merchant
  merchantId?: string; // Optional - merchant ID

  // Financial details
  originalAmount?: number; // Foreign currency adjustment
  originalCurrency?: string;
  exchangeRate?: number; // Optional - exchange rate for foreign currency
  fees?: number; // Optional - transaction fees
  tax?: number; // Optional - tax amount

  // Recurrence
  isRecurring: boolean;
  recurrencePattern: RecurrencePattern;
  recurrenceInterval?: number;
  recurrenceEndDate?: Date;
  nextOccurrence?: Date;
  parentTransactionId?: mongoose.Types.ObjectId; // recurring series

  // Attachments and Notes
  attachments: {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    uploadedAt: Date;
  }[];

  notes?: string;

  // Metadata
  source: string; // 'manual', 'import', 'api', 'webhook', 'scheduled'
  externalId?: string; // Optional - external ID from source
  lastSyncedAt?: Date; // Optional - last synced from source

  // User and Ownership
  userId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;

  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  isDeleted: boolean;

  // Computed fields (Virtuals)
  fullCategoryPath?: string;
  formattedAmount?: string;
  daysSinceTransaction?: number;
  totalAmount?: number;

  // Instance methods
  calculateNextOccurrence(fromDate?: Date, pattern?: RecurrencePattern): Date;
}

// Transaction model Interface with Static methods
export interface ITransactionModel extends Model<ITransaction> {
  getTransactionsByDateRange(
    userId: string,
    accountId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ITransaction[]>;

  getTransactionStats(
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
  >;

  getRecurringTransactions(userId: string): Promise<ITransaction[]>;

  createRecurringSeries(
    transactionData: Partial<ITransaction>,
    pattern: RecurrencePattern,
    endDate: Date
  ): Promise<ITransaction[]>;
}
