import { Injectable } from '@angular/core';
import { ChartOptions } from './chart.service';

export interface ResponsiveBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
}

export interface ChartTheme {
  name: string;
  colors: {
    primary: string[];
    secondary: string[];
    success: string[];
    warning: string[];
    danger: string[];
    info: string[];
    light: string[];
    dark: string[];
  };
  fonts: {
    family: string;
    sizes: {
      title: number;
      subtitle: number;
      label: number;
      legend: number;
      tooltip: number;
    };
  };
  spacing: {
    padding: number;
    margin: number;
    borderRadius: number;
  };
}

export interface ResponsiveChartConfig {
  breakpoints: ResponsiveBreakpoints;
  mobile: ChartOptions;
  tablet: ChartOptions;
  desktop: ChartOptions;
}

@Injectable({
  providedIn: 'root'
})
export class ChartStylesService {

  private readonly defaultBreakpoints: ResponsiveBreakpoints = {
    mobile: 768,
    tablet: 1024,
    desktop: 1200
  };

  private readonly themes: { [key: string]: ChartTheme } = {
    default: {
      name: 'Default',
      colors: {
        primary: ['#007bff', '#0056b3', '#004085'],
        secondary: ['#6c757d', '#545b62', '#3d4449'],
        success: ['#28a745', '#1e7e34', '#155724'],
        warning: ['#ffc107', '#e0a800', '#d39e00'],
        danger: ['#dc3545', '#c82333', '#bd2130'],
        info: ['#17a2b8', '#138496', '#117a8b'],
        light: ['#f8f9fa', '#e9ecef', '#dee2e6'],
        dark: ['#343a40', '#23272b', '#1d2124']
      },
      fonts: {
        family: 'Arial, sans-serif',
        sizes: {
          title: 16,
          subtitle: 14,
          label: 12,
          legend: 12,
          tooltip: 11
        }
      },
      spacing: {
        padding: 20,
        margin: 10,
        borderRadius: 8
      }
    },
    dark: {
      name: 'Dark',
      colors: {
        primary: ['#0d6efd', '#0a58ca', '#084298'],
        secondary: ['#6c757d', '#5a6268', '#495057'],
        success: ['#198754', '#146c43', '#0f5132'],
        warning: ['#fd7e14', '#fd7e14', '#e8590c'],
        danger: ['#dc3545', '#b02a37', '#842029'],
        info: ['#0dcaf0', '#0aa2c0', '#087990'],
        light: ['#f8f9fa', '#e9ecef', '#dee2e6'],
        dark: ['#212529', '#1c1f23', '#16181b']
      },
      fonts: {
        family: 'Arial, sans-serif',
        sizes: {
          title: 16,
          subtitle: 14,
          label: 12,
          legend: 12,
          tooltip: 11
        }
      },
      spacing: {
        padding: 20,
        margin: 10,
        borderRadius: 8
      }
    },
    financial: {
      name: 'Financial',
      colors: {
        primary: ['#2ecc71', '#27ae60', '#229954'],
        secondary: ['#e74c3c', '#c0392b', '#a93226'],
        success: ['#2ecc71', '#27ae60', '#229954'],
        warning: ['#f39c12', '#e67e22', '#d35400'],
        danger: ['#e74c3c', '#c0392b', '#a93226'],
        info: ['#3498db', '#2980b9', '#1f618d'],
        light: ['#ecf0f1', '#bdc3c7', '#95a5a6'],
        dark: ['#2c3e50', '#34495e', '#2c3e50']
      },
      fonts: {
        family: 'Arial, sans-serif',
        sizes: {
          title: 18,
          subtitle: 14,
          label: 12,
          legend: 11,
          tooltip: 10
        }
      },
      spacing: {
        padding: 24,
        margin: 12,
        borderRadius: 12
      }
    }
  };

  private currentTheme: string = 'default';
  private currentBreakpoint: string = 'desktop';

  constructor() {
    this.detectBreakpoint();
    this.setupResizeListener();
  }

  // Get responsive chart configuration
  getResponsiveChartConfig(chartType: string): ResponsiveChartConfig {
    const theme = this.themes[this.currentTheme];
    
    return {
      breakpoints: this.defaultBreakpoints,
      mobile: this.getMobileChartOptions(chartType, theme),
      tablet: this.getTabletChartOptions(chartType, theme),
      desktop: this.getDesktopChartOptions(chartType, theme)
    };
  }

  // Get current chart options based on screen size
  getCurrentChartOptions(chartType: string): ChartOptions {
    const config = this.getResponsiveChartConfig(chartType);
    
    switch (this.currentBreakpoint) {
      case 'mobile':
        return config.mobile;
      case 'tablet':
        return config.tablet;
      default:
        return config.desktop;
    }
  }

  // Set chart theme
  setTheme(themeName: string): void {
    if (this.themes[themeName]) {
      this.currentTheme = themeName;
    }
  }

  // Get available themes
  getAvailableThemes(): string[] {
    return Object.keys(this.themes);
  }

  // Get current theme
  getCurrentTheme(): ChartTheme {
    return this.themes[this.currentTheme];
  }

  // Get current breakpoint
  getCurrentBreakpoint(): string {
    return this.currentBreakpoint;
  }

  // Create custom theme
  createCustomTheme(name: string, theme: ChartTheme): void {
    this.themes[name] = theme;
  }

  // Get color palette for chart type
  getColorPalette(chartType: string, dataLength: number): string[] {
    const theme = this.getCurrentTheme();
    const colors: string[] = [];
    
    // Choose color set based on chart type
    let colorSet: string[];
    switch (chartType) {
      case 'line':
      case 'bar':
        colorSet = theme.colors.primary;
        break;
      case 'pie':
      case 'doughnut':
        colorSet = [...theme.colors.primary, ...theme.colors.secondary, ...theme.colors.info];
        break;
      case 'scatter':
        colorSet = theme.colors.info;
        break;
      default:
        colorSet = theme.colors.primary;
    }
    
    // Generate enough colors for the data
    for (let i = 0; i < dataLength; i++) {
      colors.push(colorSet[i % colorSet.length]);
    }
    
    return colors;
  }

  // Get responsive font size
  getResponsiveFontSize(baseSize: number): number {
    const multiplier = this.getFontSizeMultiplier();
    return Math.round(baseSize * multiplier);
  }

  // Get responsive chart height
  getResponsiveChartHeight(baseHeight: number): number {
    const multiplier = this.getHeightMultiplier();
    return Math.round(baseHeight * multiplier);
  }

  // Get responsive padding
  getResponsivePadding(basePadding: number): number {
    const multiplier = this.getPaddingMultiplier();
    return Math.round(basePadding * multiplier);
  }

  // Private methods
  private detectBreakpoint(): void {
    const width = window.innerWidth;
    
    if (width < this.defaultBreakpoints.mobile) {
      this.currentBreakpoint = 'mobile';
    } else if (width < this.defaultBreakpoints.tablet) {
      this.currentBreakpoint = 'tablet';
    } else {
      this.currentBreakpoint = 'desktop';
    }
  }

  private setupResizeListener(): void {
    window.addEventListener('resize', () => {
      const oldBreakpoint = this.currentBreakpoint;
      this.detectBreakpoint();
      
      if (oldBreakpoint !== this.currentBreakpoint) {
        // Trigger chart resize if breakpoint changed
        this.triggerChartResize();
      }
    });
  }

  private triggerChartResize(): void {
    // This would be called by chart components to resize their charts
    window.dispatchEvent(new CustomEvent('chartResize', {
      detail: { breakpoint: this.currentBreakpoint }
    }));
  }

  private getMobileChartOptions(chartType: string, theme: ChartTheme): ChartOptions {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 10,
            font: {
              size: this.getResponsiveFontSize(theme.fonts.sizes.legend)
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1,
          cornerRadius: 4,
          displayColors: true,
          titleFont: {
            size: this.getResponsiveFontSize(theme.fonts.sizes.tooltip)
          },
          bodyFont: {
            size: this.getResponsiveFontSize(theme.fonts.sizes.tooltip)
          }
        },
        title: {
          display: true,
          text: 'Chart',
          font: {
            size: this.getResponsiveFontSize(theme.fonts.sizes.title),
            family: theme.fonts.family
          }
        }
      },
      scales: this.getResponsiveScales(chartType, 'mobile', theme),
      elements: this.getResponsiveElements('mobile', theme)
    };
  }

  private getTabletChartOptions(chartType: string, theme: ChartTheme): ChartOptions {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: {
              size: this.getResponsiveFontSize(theme.fonts.sizes.legend)
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1,
          cornerRadius: 6,
          displayColors: true,
          titleFont: {
            size: this.getResponsiveFontSize(theme.fonts.sizes.tooltip)
          },
          bodyFont: {
            size: this.getResponsiveFontSize(theme.fonts.sizes.tooltip)
          }
        },
        title: {
          display: true,
          text: 'Chart',
          font: {
            size: this.getResponsiveFontSize(theme.fonts.sizes.title),
            family: theme.fonts.family
          }
        }
      },
      scales: this.getResponsiveScales(chartType, 'tablet', theme),
      elements: this.getResponsiveElements('tablet', theme)
    };
  }

  private getDesktopChartOptions(chartType: string, theme: ChartTheme): ChartOptions {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: this.getResponsiveFontSize(theme.fonts.sizes.legend)
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          titleFont: {
            size: this.getResponsiveFontSize(theme.fonts.sizes.tooltip)
          },
          bodyFont: {
            size: this.getResponsiveFontSize(theme.fonts.sizes.tooltip)
          }
        },
        title: {
          display: true,
          text: 'Chart',
          font: {
            size: this.getResponsiveFontSize(theme.fonts.sizes.title),
            family: theme.fonts.family
          }
        }
      },
      scales: this.getResponsiveScales(chartType, 'desktop', theme),
      elements: this.getResponsiveElements('desktop', theme)
    };
  }

  private getResponsiveScales(chartType: string, breakpoint: string, theme: ChartTheme): any {
    const baseFontSize = this.getResponsiveFontSize(theme.fonts.sizes.label);
    
    const scales: any = {
      x: {
        display: true,
        title: {
          display: true,
          font: {
            size: baseFontSize,
            family: theme.fonts.family
          }
        },
        ticks: {
          font: {
            size: baseFontSize,
            family: theme.fonts.family
          }
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          font: {
            size: baseFontSize,
            family: theme.fonts.family
          }
        },
        ticks: {
          font: {
            size: baseFontSize,
            family: theme.fonts.family
          }
        }
      }
    };

    // Adjust for different chart types
    if (chartType === 'pie' || chartType === 'doughnut') {
      return {};
    }

    if (chartType === 'scatter') {
      scales.x.type = 'linear';
      scales.y.type = 'linear';
    }

    // Adjust for mobile
    if (breakpoint === 'mobile') {
      scales.x.ticks.maxTicksLimit = 5;
      scales.y.ticks.maxTicksLimit = 5;
    }

    return scales;
  }

  private getResponsiveElements(breakpoint: string, theme: ChartTheme): any {
    const baseSize = breakpoint === 'mobile' ? 0.8 : breakpoint === 'tablet' ? 0.9 : 1;
    
    return {
      point: {
        radius: Math.round(4 * baseSize),
        hoverRadius: Math.round(6 * baseSize)
      },
      line: {
        borderWidth: Math.round(2 * baseSize)
      },
      bar: {
        borderRadius: Math.round(theme.spacing.borderRadius * baseSize)
      }
    };
  }

  private getFontSizeMultiplier(): number {
    switch (this.currentBreakpoint) {
      case 'mobile': return 0.8;
      case 'tablet': return 0.9;
      default: return 1;
    }
  }

  private getHeightMultiplier(): number {
    switch (this.currentBreakpoint) {
      case 'mobile': return 0.7;
      case 'tablet': return 0.85;
      default: return 1;
    }
  }

  private getPaddingMultiplier(): number {
    switch (this.currentBreakpoint) {
      case 'mobile': return 0.6;
      case 'tablet': return 0.8;
      default: return 1;
    }
  }

  // Utility methods for common responsive patterns
  getResponsiveGridColumns(): number {
    switch (this.currentBreakpoint) {
      case 'mobile': return 1;
      case 'tablet': return 2;
      default: return 3;
    }
  }

  getResponsiveChartHeight(): number {
    switch (this.currentBreakpoint) {
      case 'mobile': return 250;
      case 'tablet': return 300;
      default: return 400;
    }
  }

  shouldShowLegend(): boolean {
    return this.currentBreakpoint !== 'mobile';
  }

  shouldShowTitle(): boolean {
    return this.currentBreakpoint !== 'mobile';
  }

  getResponsiveAnimationDuration(): number {
    switch (this.currentBreakpoint) {
      case 'mobile': return 500;
      case 'tablet': return 750;
      default: return 1000;
    }
  }
}
