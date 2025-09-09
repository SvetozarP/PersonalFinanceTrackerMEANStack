import { Injectable } from '@angular/core';
import { ChartConfiguration, ChartType, ChartOptions } from 'chart.js';
import { ChartService, ChartData } from './chart.service';
import { ChartInteractionService, ChartInteractionConfig } from './chart-interaction.service';
import { ChartExportService, ExportOptions } from './chart-export.service';
import { ChartStylesService, ResponsiveChartConfig } from './chart-styles.service';

export interface ChartConfig {
  type: ChartType;
  data: ChartData;
  options: ChartOptions;
  description?: string;
  category?: string;
  interaction?: ChartInteractionConfig;
}

@Injectable({
  providedIn: 'root'
})
export class ChartConfigService {

  constructor(
    private chartService: ChartService,
    private stylesService: ChartStylesService,
    private interactionService: ChartInteractionService,
    private exportService: ChartExportService
  ) {}

  // Financial Chart Configurations
  createFinancialChartConfig(type: string, transactions: any[]): ChartConfiguration {
    let data: ChartData;
    
    switch (type) {
      case 'expense':
        data = this.chartService.generateExpenseTrendChart(transactions);
        break;
      case 'income':
        data = this.chartService.generateIncomeTrendChart(transactions);
        break;
      case 'category':
        data = this.chartService.generateCategorySpendingChart(transactions, []);
        break;
      default:
        data = this.chartService.generateExpenseTrendChart(transactions);
    }

    const options = this.chartService.getChartOptions(type);
    
    return {
      type: this.getChartType(type),
      data,
      options: options as ChartOptions
    };
  }

  // Dashboard Chart Configurations
  createDashboardChartConfig(type: string, transactions: any[]): ChartConfiguration {
    let data: ChartData;
    
    switch (type) {
      case 'balance':
        data = this.chartService.generateNetIncomeTrendChart(transactions);
        break;
      case 'incomeExpense':
        data = this.chartService.generateIncomeExpenseScatter(transactions);
        break;
      default:
        data = this.chartService.generateNetIncomeTrendChart(transactions);
    }

    const options = this.chartService.getChartOptions(type);
    
    return {
      type: this.getChartType(type),
      data,
      options: options as ChartOptions
    };
  }

  // Advanced Chart Configurations
  createAdvancedChartConfig(type: string, transactions: any[]): ChartConfiguration {
    let data: ChartData;
    
    switch (type) {
      case 'heatmap':
        data = this.chartService.generateExpenseTrendChart(transactions);
        break;
      case 'gauge':
        data = this.chartService.generateCategorySpendingChart(transactions, []);
        break;
      default:
        data = this.chartService.generateExpenseTrendChart(transactions);
    }

    const options = this.chartService.getChartOptions(type);
    
    return {
      type: this.getChartType(type),
      data,
      options: options as ChartOptions
    };
  }

  private getChartType(type: string): ChartType {
    switch (type) {
      case 'expense':
      case 'income':
      case 'balance':
        return 'line';
      case 'category':
      case 'gauge':
        return 'doughnut';
      case 'incomeExpense':
        return 'bar';
      case 'heatmap':
        return 'bar';
      default:
        return 'line';
    }
  }

  // Utility method to merge chart options
  mergeChartOptions(base: ChartOptions, override: ChartOptions | null): ChartOptions {
    if (!override) {
      return base;
    }

    return {
      ...base,
      ...override,
      plugins: {
        ...base.plugins,
        ...override.plugins
      }
    };
  }
}