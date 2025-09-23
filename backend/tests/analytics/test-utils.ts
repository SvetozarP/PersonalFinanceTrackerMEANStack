import mongoose from 'mongoose';
import { ITransaction, TransactionType, TransactionStatus, PaymentMethod, RecurrencePattern } from '../../src/modules/financial/transactions/interfaces/transaction.interface';
import { ICategory } from '../../src/modules/financial/categories/interfaces/category.interface';

/**
 * Create a mock transaction with all required properties
 */
export function createMockTransaction(overrides: Partial<ITransaction> = {}): ITransaction {
  const baseTransaction: Partial<ITransaction> = {
    _id: new mongoose.Types.ObjectId(),
    title: 'Test Transaction',
    description: 'Test Description',
    amount: 100,
    currency: 'USD',
    type: TransactionType.EXPENSE,
    status: TransactionStatus.COMPLETED,
    categoryId: new mongoose.Types.ObjectId(),
    tags: [],
    date: new Date(),
    timezone: 'UTC',
    paymentMethod: PaymentMethod.CASH,
    isRecurring: false,
    recurrencePattern: RecurrencePattern.NONE,
    attachments: [],
    source: 'manual',
    userId: new mongoose.Types.ObjectId(),
    accountId: new mongoose.Types.ObjectId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
    calculateNextOccurrence: jest.fn().mockReturnValue(new Date()),
    ...overrides
  };

  return baseTransaction as ITransaction;
}

/**
 * Create a mock category with all required properties
 */
export function createMockCategory(overrides: Partial<ICategory> = {}): ICategory {
  const baseCategory: Partial<ICategory> = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Test Category',
    description: 'Test Category Description',
    color: '#FF0000',
    icon: 'test-icon',
    userId: new mongoose.Types.ObjectId(),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };

  return baseCategory as ICategory;
}

/**
 * Create multiple mock transactions for testing
 */
export function createMockTransactions(count: number, overrides: Partial<ITransaction>[] = []): ITransaction[] {
  return Array.from({ length: count }, (_, i) => {
    const transactionOverrides = overrides[i] || {};
    return createMockTransaction({
      _id: new mongoose.Types.ObjectId(),
      title: `Test Transaction ${i + 1}`,
      amount: 100 + (i * 10),
      date: new Date(Date.now() - (count - i) * 24 * 60 * 60 * 1000),
      ...transactionOverrides
    });
  });
}

/**
 * Create mock categories for testing
 */
export function createMockCategories(count: number, overrides: Partial<ICategory>[] = []): ICategory[] {
  return Array.from({ length: count }, (_, i) => {
    const categoryOverrides = overrides[i] || {};
    return createMockCategory({
      _id: new mongoose.Types.ObjectId(),
      name: `Test Category ${i + 1}`,
      ...categoryOverrides
    });
  });
}
