import { AnalyticsService } from './analytics.service';
import { TransactionService } from '../../transactions/services/transaction.service';
import { CategoryService } from '../../categories/service/category.service';
import { BudgetService } from '../../budgets/services/budget.service';
import { logger } from '../../../../shared/services/logger.service';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { 
  IAnalyticsQuery, 
  ISpendingAnalysis, 
  IBudgetAnalytics, 
  IFinancialInsights 
} from '../interfaces/analytics.interface';

export interface IExportOptions {
  format: 'excel' | 'csv' | 'json';
  dataTypes: readonly ('transactions' | 'categories' | 'budgets' | 'analytics' | 'all')[];
  startDate: Date;
  endDate: Date;
  includeMetadata?: boolean;
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  filters?: {
    categories?: string[];
    transactionTypes?: string[];
    accounts?: string[];
    tags?: string[];
    minAmount?: number;
    maxAmount?: number;
  };
}

export interface IExportResult {
  data: Buffer | string;
  filename: string;
  mimeType: string;
  size: number;
  recordCount: number;
  exportDate: Date;
}

export class DataExportService {
  private analyticsService: AnalyticsService;
  private transactionService: TransactionService;
  private categoryService: CategoryService;
  private budgetService: BudgetService;

  constructor() {
    this.analyticsService = new AnalyticsService();
    this.transactionService = new TransactionService();
    this.categoryService = new CategoryService();
    this.budgetService = new BudgetService(
      null as any,
      null as any,
      null as any
    );
  }

  /**
   * Export financial data in various formats
   */
  async exportFinancialData(userId: string, options: IExportOptions): Promise<IExportResult> {
    try {
      logger.info('Starting data export', { userId, options });

      // Collect all requested data
      const exportData = await this.collectExportData(userId, options);

      // Generate export based on format
      switch (options.format) {
        case 'excel':
          return await this.generateExcelExport(exportData, options);
        case 'csv':
          return await this.generateCSVExport(exportData, options);
        case 'json':
          return await this.generateJSONExport(exportData, options);
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
    } catch (error) {
      logger.error('Error exporting financial data', { error: (error as Error).message, userId, options });
      throw error;
    }
  }

  /**
   * Export transactions only
   */
  async exportTransactions(userId: string, options: Omit<IExportOptions, 'dataTypes'>): Promise<IExportResult> {
    const fullOptions: IExportOptions = {
      ...options,
      dataTypes: ['transactions'] as const
    };
    try {
      logger.info('Exporting transactions', { userId, options });

      const transactions = await this.getTransactions(userId, fullOptions);
      const exportData = {
        metadata: this.createMetadata(userId, fullOptions, 'transactions'),
        transactions
      };

      return await this.generateExport(exportData, fullOptions, 'transactions');
    } catch (error) {
      logger.error('Error exporting transactions', { error: (error as Error).message, userId, options });
      throw error;
    }
  }

  /**
   * Export categories only
   */
  async exportCategories(userId: string, options: Omit<IExportOptions, 'dataTypes'>): Promise<IExportResult> {
    const fullOptions: IExportOptions = {
      ...options,
      dataTypes: ['categories'] as const
    };
    try {
      logger.info('Exporting categories', { userId, options });

      const categories = await this.getCategories(userId);
      const exportData = {
        metadata: this.createMetadata(userId, fullOptions, 'categories'),
        categories
      };

      return await this.generateExport(exportData, fullOptions, 'categories');
    } catch (error) {
      logger.error('Error exporting categories', { error: (error as Error).message, userId, options });
      throw error;
    }
  }

  /**
   * Export budgets only
   */
  async exportBudgets(userId: string, options: Omit<IExportOptions, 'dataTypes'>): Promise<IExportResult> {
    const fullOptions: IExportOptions = {
      ...options,
      dataTypes: ['budgets'] as const
    };
    try {
      logger.info('Exporting budgets', { userId, options });

      const budgets = await this.getBudgets(userId, fullOptions);
      const exportData = {
        metadata: this.createMetadata(userId, fullOptions, 'budgets'),
        budgets
      };

      return await this.generateExport(exportData, fullOptions, 'budgets');
    } catch (error) {
      logger.error('Error exporting budgets', { error: (error as Error).message, userId, options });
      throw error;
    }
  }

  /**
   * Export analytics data only
   */
  async exportAnalytics(userId: string, options: Omit<IExportOptions, 'dataTypes'>): Promise<IExportResult> {
    const fullOptions: IExportOptions = {
      ...options,
      dataTypes: ['analytics'] as const
    };
    try {
      logger.info('Exporting analytics', { userId, options });

      const analytics = await this.getAnalytics(userId, fullOptions);
      const exportData = {
        metadata: this.createMetadata(userId, fullOptions, 'analytics'),
        analytics
      };

      return await this.generateExport(exportData, fullOptions, 'analytics');
    } catch (error) {
      logger.error('Error exporting analytics', { error: (error as Error).message, userId, options });
      throw error;
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private async collectExportData(userId: string, options: IExportOptions): Promise<any> {
    const exportData: any = {
      metadata: this.createMetadata(userId, options, 'all')
    };

    // Collect data based on requested types
    if (options.dataTypes.includes('all') || options.dataTypes.includes('transactions')) {
      exportData.transactions = await this.getTransactions(userId, options);
    }

    if (options.dataTypes.includes('all') || options.dataTypes.includes('categories')) {
      exportData.categories = await this.getCategories(userId);
    }

    if (options.dataTypes.includes('all') || options.dataTypes.includes('budgets')) {
      exportData.budgets = await this.getBudgets(userId, options);
    }

    if (options.dataTypes.includes('all') || options.dataTypes.includes('analytics')) {
      exportData.analytics = await this.getAnalytics(userId, options);
    }

    return exportData;
  }

  private async getTransactions(userId: string, options: IExportOptions): Promise<any[]> {
    // In a real implementation, this would query the database with filters
    return [
      {
        id: '1',
        amount: 50.00,
        description: 'Grocery shopping',
        type: 'expense',
        category: 'Food',
        date: '2024-01-15',
        status: 'completed'
      },
      {
        id: '2',
        amount: 25.00,
        description: 'Lunch',
        type: 'expense',
        category: 'Food',
        date: '2024-01-20',
        status: 'completed'
      }
    ];
  }

  private async getCategories(userId: string): Promise<any[]> {
    // In a real implementation, this would query the database
    return [
      {
        id: '1',
        name: 'Food',
        description: 'Food and dining expenses',
        type: 'expense',
        parentId: null,
        path: 'Food'
      },
      {
        id: '2',
        name: 'Transportation',
        description: 'Transportation expenses',
        type: 'expense',
        parentId: null,
        path: 'Transportation'
      }
    ];
  }

  private async getBudgets(userId: string, options: IExportOptions): Promise<any[]> {
    // In a real implementation, this would query the database
    return [
      {
        id: '1',
        name: 'Monthly Budget',
        description: 'Monthly budget for January 2024',
        totalAmount: 1000.00,
        spentAmount: 750.00,
        remainingAmount: 250.00,
        startDate: options.startDate,
        endDate: options.endDate,
        status: 'active'
      }
    ];
  }

  private async getAnalytics(userId: string, options: IExportOptions): Promise<any> {
    const query: IAnalyticsQuery = {
      userId,
      startDate: options.startDate,
      endDate: options.endDate,
      groupBy: options.groupBy || 'month'
    };

    const [spending, budgets, insights, cashFlow] = await Promise.all([
      this.analyticsService.getSpendingAnalysis(query),
      this.analyticsService.getAllBudgetAnalytics(userId, options.startDate, options.endDate),
      this.analyticsService.getFinancialInsights(userId, options.startDate, options.endDate),
      this.analyticsService.getCashFlowAnalysis(userId, options.startDate, options.endDate)
    ]);

    return {
      spending,
      budgets,
      insights,
      cashFlow
    };
  }

  private createMetadata(userId: string, options: IExportOptions, dataType: string): any {
    return {
      exportDate: new Date(),
      userId,
      dataType,
      dateRange: {
        start: options.startDate,
        end: options.endDate
      },
      format: options.format,
      includeMetadata: options.includeMetadata || false,
      filters: options.filters || {}
    };
  }

  private async generateExport(exportData: any, options: IExportOptions, dataType: string): Promise<IExportResult> {
    switch (options.format) {
      case 'excel':
        return await this.generateExcelExport(exportData, options);
      case 'csv':
        return await this.generateCSVExport(exportData, options);
      case 'json':
        return await this.generateJSONExport(exportData, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  private async generateExcelExport(exportData: any, options: IExportOptions): Promise<IExportResult> {
    try {
      const workbook = XLSX.utils.book_new();

      // Add metadata sheet
      if (options.includeMetadata) {
        const metadataSheet = XLSX.utils.json_to_sheet([exportData.metadata]);
        XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata');
      }

      // Add data sheets
      if (exportData.transactions) {
        const transactionsSheet = XLSX.utils.json_to_sheet(exportData.transactions);
        XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transactions');
      }

      if (exportData.categories) {
        const categoriesSheet = XLSX.utils.json_to_sheet(exportData.categories);
        XLSX.utils.book_append_sheet(workbook, categoriesSheet, 'Categories');
      }

      if (exportData.budgets) {
        const budgetsSheet = XLSX.utils.json_to_sheet(exportData.budgets);
        XLSX.utils.book_append_sheet(workbook, budgetsSheet, 'Budgets');
      }

      if (exportData.analytics) {
        const analyticsSheet = XLSX.utils.json_to_sheet([exportData.analytics]);
        XLSX.utils.book_append_sheet(workbook, analyticsSheet, 'Analytics');
      }

      // Generate Excel buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      const filename = `financial-data-export-${new Date().toISOString().split('T')[0]}.xlsx`;

      return {
        data: excelBuffer,
        filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: excelBuffer.length,
        recordCount: this.calculateRecordCount(exportData),
        exportDate: new Date()
      };
    } catch (error) {
      logger.error('Error generating Excel export', { error: (error as Error).message });
      throw error;
    }
  }

  private async generateCSVExport(exportData: any, options: IExportOptions): Promise<IExportResult> {
    try {
      let csvContent = '';

      // Add metadata
      if (options.includeMetadata) {
        csvContent += 'METADATA\n';
        csvContent += `Export Date,${exportData.metadata.exportDate}\n`;
        csvContent += `User ID,${exportData.metadata.userId}\n`;
        csvContent += `Data Type,${exportData.metadata.dataType}\n`;
        csvContent += `Date Range,${exportData.metadata.dateRange.start} to ${exportData.metadata.dateRange.end}\n\n`;
      }

      // Add transactions
      if (exportData.transactions && exportData.transactions.length > 0) {
        csvContent += 'TRANSACTIONS\n';
        csvContent += 'ID,Amount,Description,Type,Category,Date,Status\n';
        exportData.transactions.forEach((transaction: any) => {
          csvContent += `${transaction.id},${transaction.amount},${transaction.description},${transaction.type},${transaction.category},${transaction.date},${transaction.status}\n`;
        });
        csvContent += '\n';
      }

      // Add categories
      if (exportData.categories && exportData.categories.length > 0) {
        csvContent += 'CATEGORIES\n';
        csvContent += 'ID,Name,Description,Type,Parent ID,Path\n';
        exportData.categories.forEach((category: any) => {
          csvContent += `${category.id},${category.name},${category.description},${category.type},${category.parentId || ''},${category.path}\n`;
        });
        csvContent += '\n';
      }

      // Add budgets
      if (exportData.budgets && exportData.budgets.length > 0) {
        csvContent += 'BUDGETS\n';
        csvContent += 'ID,Name,Description,Total Amount,Spent Amount,Remaining Amount,Start Date,End Date,Status\n';
        exportData.budgets.forEach((budget: any) => {
          csvContent += `${budget.id},${budget.name},${budget.description},${budget.totalAmount},${budget.spentAmount},${budget.remainingAmount},${budget.startDate},${budget.endDate},${budget.status}\n`;
        });
        csvContent += '\n';
      }

      const filename = `financial-data-export-${new Date().toISOString().split('T')[0]}.csv`;

      return {
        data: Buffer.from(csvContent, 'utf8'),
        filename,
        mimeType: 'text/csv',
        size: csvContent.length,
        recordCount: this.calculateRecordCount(exportData),
        exportDate: new Date()
      };
    } catch (error) {
      logger.error('Error generating CSV export', { error: (error as Error).message });
      throw error;
    }
  }

  private async generateJSONExport(exportData: any, options: IExportOptions): Promise<IExportResult> {
    try {
      const jsonContent = JSON.stringify(exportData, null, 2);
      const filename = `financial-data-export-${new Date().toISOString().split('T')[0]}.json`;

      return {
        data: Buffer.from(jsonContent, 'utf8'),
        filename,
        mimeType: 'application/json',
        size: jsonContent.length,
        recordCount: this.calculateRecordCount(exportData),
        exportDate: new Date()
      };
    } catch (error) {
      logger.error('Error generating JSON export', { error: (error as Error).message });
      throw error;
    }
  }

  private calculateRecordCount(exportData: any): number {
    let count = 0;
    if (exportData.transactions) count += exportData.transactions.length;
    if (exportData.categories) count += exportData.categories.length;
    if (exportData.budgets) count += exportData.budgets.length;
    if (exportData.analytics) count += 1; // Analytics is a single object
    return count;
  }
}
