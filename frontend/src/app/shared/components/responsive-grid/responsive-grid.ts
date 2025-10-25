import { Component, Input, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

export interface GridBreakpoint {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  xxl?: number;
}

export interface GridItem {
  id: string;
  content: any;
  breakpoints?: GridBreakpoint;
  order?: number;
  className?: string;
}

@Component({
  selector: 'app-responsive-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './responsive-grid.html',
  styleUrls: ['./responsive-grid.scss']
})
export class ResponsiveGridComponent implements OnInit, OnDestroy {
  @Input() items: GridItem[] = [];
  @Input() columns: GridBreakpoint = { xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 4 };
  @Input() gap: string = '1rem';
  @Input() autoFit: boolean = false;
  @Input() autoFill: boolean = false;
  @Input() minItemWidth: string = '250px';
  @Input() maxItemWidth: string = '1fr';
  @Input() className: string = '';

  private destroy$ = new Subject<void>();
  
  // Responsive state
  currentBreakpoint = signal<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'>('xs');
  screenWidth = signal(0);

  // Breakpoint definitions
  private breakpoints = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400
  };

  ngOnInit(): void {
    this.setupResponsiveListeners();
    this.updateScreenSize();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupResponsiveListeners(): void {
    fromEvent(window, 'resize')
      .pipe(
        debounceTime(100),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateScreenSize();
      });

    fromEvent(window, 'orientationchange')
      .pipe(
        debounceTime(100),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateScreenSize();
      });
  }

  private updateScreenSize(): void {
    const width = window.innerWidth;
    this.screenWidth.set(width);

    // Determine current breakpoint
    if (width >= this.breakpoints.xxl) {
      this.currentBreakpoint.set('xxl');
    } else if (width >= this.breakpoints.xl) {
      this.currentBreakpoint.set('xl');
    } else if (width >= this.breakpoints.lg) {
      this.currentBreakpoint.set('lg');
    } else if (width >= this.breakpoints.md) {
      this.currentBreakpoint.set('md');
    } else if (width >= this.breakpoints.sm) {
      this.currentBreakpoint.set('sm');
    } else {
      this.currentBreakpoint.set('xs');
    }
  }

  getCurrentColumns(): number {
    const breakpoint = this.currentBreakpoint();
    return this.columns[breakpoint] || this.columns.xs || 1;
  }

  getGridStyle(): { [key: string]: string } {
    const currentColumns = this.getCurrentColumns();
    
    if (this.autoFit) {
      return {
        'grid-template-columns': `repeat(auto-fit, minmax(${this.minItemWidth}, ${this.maxItemWidth}))`,
        'gap': this.gap
      };
    }
    
    if (this.autoFill) {
      return {
        'grid-template-columns': `repeat(auto-fill, minmax(${this.minItemWidth}, ${this.maxItemWidth}))`,
        'gap': this.gap
      };
    }

    return {
      'grid-template-columns': `repeat(${currentColumns}, 1fr)`,
      'gap': this.gap
    };
  }

  getItemStyle(item: GridItem): { [key: string]: string } {
    const breakpoint = this.currentBreakpoint();
    const itemBreakpoints = item.breakpoints || {};
    const itemColumns = itemBreakpoints[breakpoint] || 1;
    const order = item.order || 0;

    return {
      'grid-column': `span ${itemColumns}`,
      'order': order.toString()
    };
  }

  getGridClasses(): string {
    const classes = ['responsive-grid'];
    
    if (this.className) {
      classes.push(this.className);
    }
    
    classes.push(`grid-${this.currentBreakpoint()}`);
    
    if (this.autoFit) {
      classes.push('grid-auto-fit');
    }
    
    if (this.autoFill) {
      classes.push('grid-auto-fill');
    }
    
    return classes.join(' ');
  }

  getItemClasses(item: GridItem): string {
    const classes = ['grid-item'];
    
    if (item.className) {
      classes.push(item.className);
    }
    
    const breakpoint = this.currentBreakpoint();
    const itemBreakpoints = item.breakpoints || {};
    const itemColumns = itemBreakpoints[breakpoint] || 1;
    
    classes.push(`item-${breakpoint}-${itemColumns}`);
    
    return classes.join(' ');
  }

  trackByItemId(index: number, item: GridItem): string {
    return item.id;
  }
}























