import { AnalyticsService } from './analytics.service';
import { TransactionService } from '../../transactions/services/transaction.service';
import { CategoryService } from '../../categories/service/category.service';
import { BudgetService } from '../../budgets/services/budget.service';
import { logger } from '../../../../shared/services/logger.service';
import * as XLSX from 'xlsx';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { 
  IAnalyticsQuery, 
  ISpendingAnalysis, 
  IBudgetAnalytics, 
  IFinancialInsights 
} from '../interfaces/analytics.interface';

export interface IReportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  reportType: 'spending' | 'budgets' | 'cashflow' | 'comprehensive';
  startDate: Date;
  endDate: Date;
  includeCharts?: boolean;
  includeInsights?: boolean;
  includeRecommendations?: boolean;
}

export interface IReportResult {
  data: Buffer | string;
  filename: string;
  mimeType: string;
  size: number;
}

export class ReportGeneratorService {
  private analyticsService: AnalyticsService;
  private transactionService: TransactionService;
  private categoryService: CategoryService;
  private budgetService: BudgetService;

  constructor() {
    this.analyticsService = new AnalyticsService();
    this.transactionService = new TransactionService();
    this.categoryService = new CategoryService();
    this.budgetService = new BudgetService(
      null as any, // Mock BudgetRepository
      null as any, // Mock TransactionRepository
      null as any  // Mock CategoryRepository
    );
  }

  /**
   * Generate a comprehensive financial report
   */
  async generateReport(userId: string, options: IReportOptions): Promise<IReportResult> {
    try {
      logger.info('Generating financial report', { userId, options });

      // Collect all necessary data
      const reportData = await this.collectReportData(userId, options);

      // Generate report based on format
      switch (options.format) {
        case 'pdf':
          return await this.generatePDFReport(reportData, options);
        case 'excel':
          return await this.generateExcelReport(reportData, options);
        case 'csv':
          return await this.generateCSVReport(reportData, options);
        case 'json':
          return await this.generateJSONReport(reportData, options);
        default:
          throw new Error(`Unsupported format: ${options.format}`);
      }
    } catch (error) {
      logger.error('Error generating report', { error: (error as Error).message, userId, options });
      throw error;
    }
  }

  /**
   * Collect all data needed for the report
   */
  private async collectReportData(userId: string, options: IReportOptions): Promise<any> {
    const query: IAnalyticsQuery = {
      userId,
      startDate: options.startDate,
      endDate: options.endDate,
      groupBy: 'month'
    };

    const reportData: any = {
      metadata: {
        generatedAt: new Date(),
        userId,
        dateRange: {
          start: options.startDate,
          end: options.endDate
        },
        reportType: options.reportType
      }
    };

    // Get spending analysis
    if (options.reportType === 'spending' || options.reportType === 'comprehensive') {
      reportData.spending = await this.analyticsService.getSpendingAnalysis(query);
    }

    // Get budget analytics
    if (options.reportType === 'budgets' || options.reportType === 'comprehensive') {
      reportData.budgets = await this.analyticsService.getAllBudgetAnalytics(
        userId,
        options.startDate,
        options.endDate
      );
    }

    // Get financial insights
    if (options.includeInsights) {
      reportData.insights = await this.analyticsService.getFinancialInsights(
        userId,
        options.startDate,
        options.endDate
      );
    }

    // Get cash flow analysis
    if (options.reportType === 'cashflow' || options.reportType === 'comprehensive') {
      reportData.cashFlow = await this.analyticsService.getCashFlowAnalysis(userId, query.startDate, query.endDate);
    }

    return reportData;
  }

  /**
   * Generate PDF report using Puppeteer
   */
  private async generatePDFReport(reportData: any, options: IReportOptions): Promise<IReportResult> {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      
      // Generate HTML content
      const htmlContent = this.generateHTMLReport(reportData, options);
      
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });

      await browser.close();

      const filename = `financial-report-${options.reportType}-${new Date().toISOString().split('T')[0]}.pdf`;

      return {
        data: Buffer.from(pdfBuffer),
        filename,
        mimeType: 'application/pdf',
        size: pdfBuffer.length
      };
    } catch (error) {
      logger.error('Error generating PDF report', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Generate Excel report
   */
  private async generateExcelReport(reportData: any, options: IReportOptions): Promise<IReportResult> {
    try {
      const workbook = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = this.prepareSummaryData(reportData);
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Spending analysis sheet
      if (reportData.spending) {
        const spendingData = this.prepareSpendingData(reportData.spending);
        const spendingSheet = XLSX.utils.json_to_sheet(spendingData);
        XLSX.utils.book_append_sheet(workbook, spendingSheet, 'Spending Analysis');
      }

      // Budget analysis sheet
      if (reportData.budgets) {
        const budgetData = this.prepareBudgetData(reportData.budgets);
        const budgetSheet = XLSX.utils.json_to_sheet(budgetData);
        XLSX.utils.book_append_sheet(workbook, budgetSheet, 'Budget Analysis');
      }

      // Cash flow sheet
      if (reportData.cashFlow) {
        const cashFlowData = this.prepareCashFlowData(reportData.cashFlow);
        const cashFlowSheet = XLSX.utils.json_to_sheet(cashFlowData);
        XLSX.utils.book_append_sheet(workbook, cashFlowSheet, 'Cash Flow');
      }

      // Generate Excel buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      const filename = `financial-report-${options.reportType}-${new Date().toISOString().split('T')[0]}.xlsx`;

      return {
        data: excelBuffer,
        filename,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: excelBuffer.length
      };
    } catch (error) {
      logger.error('Error generating Excel report', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Generate CSV report
   */
  private async generateCSVReport(reportData: any, options: IReportOptions): Promise<IReportResult> {
    try {
      let csvContent = '';

      // Add metadata
      csvContent += 'Report Type,Generated At,Date Range\n';
      csvContent += `${options.reportType},${reportData.metadata.generatedAt},${reportData.metadata.dateRange.start} to ${reportData.metadata.dateRange.end}\n\n`;

      // Add spending data
      if (reportData.spending) {
        csvContent += 'SPENDING ANALYSIS\n';
        csvContent += 'Category,Amount,Percentage\n';
        
        if (reportData.spending.categoryBreakdown) {
          reportData.spending.categoryBreakdown.forEach((cat: any) => {
            csvContent += `${cat.categoryName},${cat.amount},${cat.percentage}\n`;
          });
        }
        csvContent += '\n';
      }

      // Add budget data
      if (reportData.budgets) {
        csvContent += 'BUDGET ANALYSIS\n';
        csvContent += 'Budget Name,Allocated,Spent,Variance,Percentage\n';
        
        reportData.budgets.forEach((budget: any) => {
          csvContent += `${budget.budgetName},${budget.totalAllocated},${budget.totalSpent},${budget.varianceAmount},${budget.variancePercentage}\n`;
        });
        csvContent += '\n';
      }

      const filename = `financial-report-${options.reportType}-${new Date().toISOString().split('T')[0]}.csv`;

      return {
        data: Buffer.from(csvContent, 'utf8'),
        filename,
        mimeType: 'text/csv',
        size: csvContent.length
      };
    } catch (error) {
      logger.error('Error generating CSV report', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Generate JSON report
   */
  private async generateJSONReport(reportData: any, options: IReportOptions): Promise<IReportResult> {
    try {
      const jsonContent = JSON.stringify(reportData, null, 2);
      const filename = `financial-report-${options.reportType}-${new Date().toISOString().split('T')[0]}.json`;

      return {
        data: Buffer.from(jsonContent, 'utf8'),
        filename,
        mimeType: 'application/json',
        size: jsonContent.length
      };
    } catch (error) {
      logger.error('Error generating JSON report', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Generate HTML content for PDF
   */
  private generateHTMLReport(reportData: any, options: IReportOptions): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Financial Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 30px; }
          .section h2 { color: #333; border-bottom: 2px solid #333; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Financial Report</h1>
          <p>Generated on: ${reportData.metadata.generatedAt}</p>
          <p>Period: ${reportData.metadata.dateRange.start} to ${reportData.metadata.dateRange.end}</p>
        </div>

        ${this.generateSpendingHTML(reportData.spending)}
        ${this.generateBudgetHTML(reportData.budgets)}
        ${this.generateCashFlowHTML(reportData.cashFlow)}
        ${this.generateInsightsHTML(reportData.insights)}
      </body>
      </html>
    `;
  }

  private generateSpendingHTML(spending: any): string {
    if (!spending) return '';
    
    return `
      <div class="section">
        <h2>Spending Analysis</h2>
        <div class="summary">
          <p><strong>Total Spent:</strong> $${spending.totalSpent?.toFixed(2) || '0.00'}</p>
          <p><strong>Average Daily:</strong> $${spending.averageDailySpending?.toFixed(2) || '0.00'}</p>
        </div>
        ${spending.spendingByCategory ? `
          <table>
            <tr><th>Category</th><th>Amount</th><th>Percentage</th></tr>
            ${spending.spendingByCategory.map((cat: any) => `
              <tr><td>${cat.categoryName}</td><td>$${cat.amount.toFixed(2)}</td><td>${cat.percentage.toFixed(1)}%</td></tr>
            `).join('')}
          </table>
        ` : ''}
      </div>
    `;
  }

  private generateBudgetHTML(budgets: any): string {
    if (!budgets || !Array.isArray(budgets)) return '';
    
    return `
      <div class="section">
        <h2>Budget Analysis</h2>
        <table>
          <tr><th>Budget Name</th><th>Allocated</th><th>Spent</th><th>Remaining</th><th>Utilization</th></tr>
          ${budgets.map((budget: any) => `
            <tr>
              <td>${budget.budgetName}</td>
              <td>$${budget.totalAllocated?.toFixed(2) || '0.00'}</td>
              <td>$${budget.totalSpent?.toFixed(2) || '0.00'}</td>
              <td>$${budget.remainingAmount?.toFixed(2) || '0.00'}</td>
              <td>${budget.utilizationPercentage?.toFixed(1) || '0.0'}%</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  private generateCashFlowHTML(cashFlow: any): string {
    if (!cashFlow) return '';
    
    return `
      <div class="section">
        <h2>Cash Flow Analysis</h2>
        <div class="summary">
          <p><strong>Net Cash Flow:</strong> $${cashFlow.netCashFlow?.toFixed(2) || '0.00'}</p>
          <p><strong>Total Inflows:</strong> $${cashFlow.totalInflows?.toFixed(2) || '0.00'}</p>
          <p><strong>Total Outflows:</strong> $${cashFlow.totalOutflows?.toFixed(2) || '0.00'}</p>
        </div>
      </div>
    `;
  }

  private generateInsightsHTML(insights: any): string {
    if (!insights) return '';
    
    return `
      <div class="section">
        <h2>Financial Insights</h2>
        <div class="summary">
          ${insights.recommendations ? insights.recommendations.map((rec: any) => `
            <p><strong>${rec.type}:</strong> ${rec.message}</p>
          `).join('') : ''}
        </div>
      </div>
    `;
  }

  // Helper methods for Excel data preparation
  private prepareSummaryData(reportData: any): any[] {
    return [
      { Metric: 'Report Type', Value: reportData.metadata.reportType },
      { Metric: 'Generated At', Value: reportData.metadata.generatedAt },
      { Metric: 'Start Date', Value: reportData.metadata.dateRange.start },
      { Metric: 'End Date', Value: reportData.metadata.dateRange.end }
    ];
  }

  private prepareSpendingData(spending: any): any[] {
    const data: any[] = [];
    if (spending.spendingByCategory) {
      spending.spendingByCategory.forEach((cat: any) => {
        data.push({
          Category: cat.categoryName,
          Amount: cat.amount,
          Percentage: cat.percentage
        });
      });
    }
    return data;
  }

  private prepareBudgetData(budgets: any): any[] {
    if (!Array.isArray(budgets)) return [];
    return budgets.map((budget: any) => ({
      'Budget Name': budget.budgetName,
      'Allocated': budget.totalAllocated,
      'Spent': budget.totalSpent,
      'Remaining': budget.remainingAmount,
      'Utilization': budget.utilizationPercentage
    }));
  }

  private prepareCashFlowData(cashFlow: any): any[] {
    return [
      { Metric: 'Net Cash Flow', Value: cashFlow.netCashFlow },
      { Metric: 'Total Inflows', Value: cashFlow.totalInflows },
      { Metric: 'Total Outflows', Value: cashFlow.totalOutflows }
    ];
  }
}
