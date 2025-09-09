import { Injectable } from '@angular/core';
import { ChartConfiguration, ChartType } from 'chart.js';
import { ChartService, ChartData, ChartOptions } from './chart.service';
import { ChartInteractionService, ChartInteractionConfig } from './chart-interaction.service';
import { ChartExportService, ExportOptions } from './chart-export.service';
import { ChartStylesService, ResponsiveChartConfig } from './chart-styles.service';

export interface ChartConfig {
  type: ChartType;
  data: ChartData;
  options: ChartOptions;
  interaction?: ChartInteractionConfig;
  export?: ExportOptions;
  responsive?: boolean;
  theme?: string;
}

export interface ChartPreset {
  name: string;
  description: string;
  config: ChartConfig;
  category: 'financial' | 'analytics' | 'dashboard' | 'report';
}

@Injectable({
  providedIn: 'root'
})
export class ChartConfigService {

  private chartService = new ChartService();
  private interactionService = new ChartInteractionService();
  private exportService = new ChartExportService();
  private stylesService = new ChartStylesService();

  private presets: { [key: string]: ChartPreset } = {};

  constructor() {
    this.initializePresets();
  }

  // Create a complete chart configuration
  createChartConfig(
    type: ChartType,
    data: ChartData,
    options: Partial<ChartOptions> = {},
    interactionConfig: ChartInteractionConfig = {},
    exportOptions: ExportOptions = {},
    theme: string = 'default'
  ): ChartConfiguration {
    // Set theme
    this.stylesService.setTheme(theme);

    // Get responsive options
    const responsiveOptions = this.stylesService.getCurrentChartOptions(type);
    
    // Merge options
    const mergedOptions = this.mergeOptions(responsiveOptions, options);

    // Create interaction configuration
    const interactionOptions = this.interactionService.createInteractiveChart(
      type,
      data,
      mergedOptions,
      interactionConfig
    );

    return interactionOptions;
  }

  // Create financial chart configuration
  createFinancialChartConfig(
    chartType: 'expense' | 'income' | 'category' | 'trend' | 'savings' | 'scatter',
    data: any,
    options: Partial<ChartOptions> = {}
  ): ChartConfiguration {
    const preset = this.getPreset(`financial_${chartType}`);
    if (preset) {
      return this.createChartConfig(
        preset.config.type,
        data,
        { ...preset.config.options, ...options },
        preset.config.interaction,
        preset.config.export,
        'financial'
      );
    }

    // Fallback to default configuration
    return this.createChartConfig(
      this.getChartTypeFromString(chartType),
      data,
      options,
      this.getDefaultInteractionConfig(),
      this.getDefaultExportOptions(),
      'financial'
    );
  }

  // Create dashboard chart configuration
  createDashboardChartConfig(
    chartType: 'balance' | 'incomeExpense' | 'category' | 'trend' | 'realtime',
    data: any,
    options: Partial<ChartOptions> = {}
  ): ChartConfiguration {
    const preset = this.getPreset(`dashboard_${chartType}`);
    if (preset) {
      return this.createChartConfig(
        preset.config.type,
        data,
        { ...preset.config.options, ...options },
        preset.config.interaction,
        preset.config.export,
        'default'
      );
    }

    return this.createChartConfig(
      this.getChartTypeFromString(chartType),
      data,
      options,
      this.getDefaultInteractionConfig(),
      this.getDefaultExportOptions(),
      'default'
    );
  }

  // Create advanced chart configuration
  createAdvancedChartConfig(
    chartType: 'heatmap' | 'gauge' | 'indicator' | 'waterfall' | 'radar' | 'bubble',
    data: any,
    options: Partial<ChartOptions> = {}
  ): ChartConfiguration {
    const preset = this.getPreset(`advanced_${chartType}`);
    if (preset) {
      return this.createChartConfig(
        preset.config.type,
        data,
        { ...preset.config.options, ...options },
        preset.config.interaction,
        preset.config.export,
        'financial'
      );
    }

    return this.createChartConfig(
      this.getChartTypeFromString(chartType),
      data,
      options,
      this.getDefaultInteractionConfig(),
      this.getDefaultExportOptions(),
      'financial'
    );
  }

  // Get chart preset
  getPreset(name: string): ChartPreset | null {
    return this.presets[name] || null;
  }

  // Get all presets by category
  getPresetsByCategory(category: string): ChartPreset[] {
    return Object.values(this.presets).filter(preset => preset.category === category);
  }

  // Create custom preset
  createPreset(name: string, preset: ChartPreset): void {
    this.presets[name] = preset;
  }

  // Export chart using the export service
  exportChart(chart: any, options: ExportOptions = {}): void {
    this.exportService.exportChartAsImage(chart, options);
  }

  // Get responsive configuration
  getResponsiveConfig(chartType: string): ResponsiveChartConfig {
    return this.stylesService.getResponsiveChartConfig(chartType);
  }

  // Get current theme
  getCurrentTheme(): string {
    return this.stylesService.getCurrentTheme().name;
  }

  // Set theme
  setTheme(themeName: string): void {
    this.stylesService.setTheme(themeName);
  }

  // Get available themes
  getAvailableThemes(): string[] {
    return this.stylesService.getAvailableThemes();
  }

  // Private methods
  private initializePresets(): void {
    // Financial chart presets
    this.presets['financial_expense'] = {
      name: 'Expense Trend',
      description: 'Line chart showing expense trends over time',
      category: 'financial',
      config: {
        type: 'line',
        data: {} as ChartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Expense Trends'
            },
            legend: {
              display: true,
              position: 'top'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value: any) {
                  return '$' + value.toLocaleString();
                }
              }
            }
          }
        },
        interaction: {
          zoom: { enabled: true, mode: 'xy' },
          pan: { enabled: true, mode: 'xy' }
        },
        export: {
          filename: 'expense-trend',
          format: 'png'
        }
      }
    };

    this.presets['financial_income'] = {
      name: 'Income Trend',
      description: 'Line chart showing income trends over time',
      category: 'financial',
      config: {
        type: 'line',
        data: {} as ChartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Income Trends'
            }
          }
        },
        interaction: {
          zoom: { enabled: true, mode: 'xy' },
          pan: { enabled: true, mode: 'xy' }
        },
        export: {
          filename: 'income-trend',
          format: 'png'
        }
      }
    };

    this.presets['financial_category'] = {
      name: 'Category Spending',
      description: 'Doughnut chart showing spending by category',
      category: 'financial',
      config: {
        type: 'doughnut',
        data: {} as ChartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Spending by Category'
            },
            legend: {
              position: 'bottom'
            }
          }
        },
        interaction: {
          zoom: { enabled: false },
          pan: { enabled: false }
        },
        export: {
          filename: 'category-spending',
          format: 'png'
        }
      }
    };

    this.presets['financial_trend'] = {
      name: 'Net Income Trend',
      description: 'Multi-line chart showing income, expenses, and net income',
      category: 'financial',
      config: {
        type: 'line',
        data: {} as ChartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Net Income Trend'
            }
          }
        },
        interaction: {
          zoom: { enabled: true, mode: 'xy' },
          pan: { enabled: true, mode: 'xy' }
        },
        export: {
          filename: 'net-income-trend',
          format: 'png'
        }
      }
    };

    this.presets['financial_savings'] = {
      name: 'Savings Rate',
      description: 'Line chart showing savings rate over time',
      category: 'financial',
      config: {
        type: 'line',
        data: {} as ChartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Savings Rate Trend'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                callback: function(value: any) {
                  return value + '%';
                }
              }
            }
          }
        },
        interaction: {
          zoom: { enabled: true, mode: 'xy' },
          pan: { enabled: true, mode: 'xy' }
        },
        export: {
          filename: 'savings-rate',
          format: 'png'
        }
      }
    };

    this.presets['financial_scatter'] = {
      name: 'Income vs Expenses',
      description: 'Scatter plot showing correlation between income and expenses',
      category: 'financial',
      config: {
        type: 'scatter',
        data: {} as ChartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Income vs Expenses Correlation'
            }
          }
        },
        interaction: {
          zoom: { enabled: true, mode: 'xy' },
          pan: { enabled: true, mode: 'xy' }
        },
        export: {
          filename: 'income-expenses-scatter',
          format: 'png'
        }
      }
    };

    // Dashboard chart presets
    this.presets['dashboard_balance'] = {
      name: 'Account Balance',
      description: 'Line chart showing account balance over time',
      category: 'dashboard',
      config: {
        type: 'line',
        data: {} as ChartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Account Balance'
            }
          }
        },
        interaction: {
          zoom: { enabled: true, mode: 'xy' },
          pan: { enabled: true, mode: 'xy' }
        },
        export: {
          filename: 'account-balance',
          format: 'png'
        }
      }
    };

    this.presets['dashboard_incomeExpense'] = {
      name: 'Income vs Expenses',
      description: 'Bar chart comparing monthly income and expenses',
      category: 'dashboard',
      config: {
        type: 'bar',
        data: {} as ChartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Monthly Income vs Expenses'
            }
          }
        },
        interaction: {
          zoom: { enabled: true, mode: 'xy' },
          pan: { enabled: true, mode: 'xy' }
        },
        export: {
          filename: 'income-expenses',
          format: 'png'
        }
      }
    };

    // Advanced chart presets
    this.presets['advanced_heatmap'] = {
      name: 'Spending Heatmap',
      description: 'Scatter plot showing daily spending patterns',
      category: 'analytics',
      config: {
        type: 'scatter',
        data: {} as ChartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Spending Heatmap'
            }
          }
        },
        interaction: {
          zoom: { enabled: true, mode: 'xy' },
          pan: { enabled: true, mode: 'xy' }
        },
        export: {
          filename: 'spending-heatmap',
          format: 'png'
        }
      }
    };

    this.presets['advanced_gauge'] = {
      name: 'Financial Health Gauges',
      description: 'Doughnut charts showing key financial ratios',
      category: 'analytics',
      config: {
        type: 'doughnut',
        data: {} as ChartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Financial Health Gauges'
            }
          }
        },
        interaction: {
          zoom: { enabled: false },
          pan: { enabled: false }
        },
        export: {
          filename: 'financial-gauges',
          format: 'png'
        }
      }
    };

    this.presets['advanced_radar'] = {
      name: 'Financial Health Radar',
      description: 'Radar chart showing multi-dimensional financial health',
      category: 'analytics',
      config: {
        type: 'radar',
        data: {} as ChartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Financial Health Radar'
            }
          }
        },
        interaction: {
          zoom: { enabled: false },
          pan: { enabled: false }
        },
        export: {
          filename: 'financial-radar',
          format: 'png'
        }
      }
    };
  }

  private mergeOptions(base: ChartOptions, override: Partial<ChartOptions>): ChartOptions {
    return {
      ...base,
      ...override,
      plugins: {
        ...base.plugins,
        ...override.plugins
      }
    };
  }

  private getChartTypeFromString(type: string): ChartType {
    const typeMap: { [key: string]: ChartType } = {
      'expense': 'line',
      'income': 'line',
      'category': 'doughnut',
      'trend': 'line',
      'savings': 'line',
      'scatter': 'scatter',
      'balance': 'line',
      'incomeExpense': 'bar',
      'realtime': 'line',
      'heatmap': 'scatter',
      'gauge': 'doughnut',
      'indicator': 'bar',
      'waterfall': 'bar',
      'radar': 'radar',
      'bubble': 'bubble'
    };

    return typeMap[type] || 'line';
  }

  private getDefaultInteractionConfig(): ChartInteractionConfig {
    return {
      zoom: { enabled: true, mode: 'xy' },
      pan: { enabled: true, mode: 'xy' },
      tooltips: true,
      legend: true,
      animation: true
    };
  }

  private getDefaultExportOptions(): ExportOptions {
    return {
      filename: 'chart',
      format: 'png',
      quality: 0.9
    };
  }
}
