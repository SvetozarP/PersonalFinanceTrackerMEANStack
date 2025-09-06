import { Component, OnInit, OnDestroy, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { RealtimeBudgetProgressService } from '../../../../core/services/realtime-budget-progress.service';

@Component({
  selector: 'app-lazy-realtime-budget-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="lazy-realtime-wrapper" *ngIf="!isLoaded">
      <div class="loading-placeholder">
        <div class="spinner"></div>
        <p>Loading real-time budget data...</p>
      </div>
    </div>
    <ng-container *ngIf="isLoaded">
      <ng-content></ng-content>
    </ng-container>
  `,
  styles: [`
    .lazy-realtime-wrapper {
      background: white;
      border-radius: 12px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 24px;
    }
    
    .loading-placeholder {
      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e9ecef;
        border-top: 3px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 16px;
      }
      
      p {
        margin: 0;
        color: #6c757d;
        font-size: 14px;
      }
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class LazyRealtimeBudgetProgressComponent implements OnInit, OnDestroy {
  @Input() showAlerts: boolean = true;
  @Input() showStats: boolean = true;
  @Input() compact: boolean = false;
  @Input() autoRefresh: boolean = true;
  
  @Output() budgetClick = new EventEmitter<any>();
  @Output() categoryClick = new EventEmitter<any>();
  @Output() alertClick = new EventEmitter<any>();

  private destroy$ = new Subject<void>();
  private realtimeService = inject(RealtimeBudgetProgressService);
  
  isLoaded = false;
  private loadTimeout: any;

  ngOnInit(): void {
    // Delay loading to reduce initial bundle impact
    this.loadTimeout = setTimeout(() => {
      this.loadRealtimeComponent();
    }, 1000); // 1 second delay
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.loadTimeout) {
      clearTimeout(this.loadTimeout);
    }
  }

  private async loadRealtimeComponent(): Promise<void> {
    try {
      // Dynamically import the real-time component
      const { RealtimeBudgetProgressComponent } = await import('./realtime-budget-progress.component');
      
      // Initialize the service
      this.realtimeService.getRealtimeProgress()
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.isLoaded = true;
        });
    } catch (error) {
      console.error('Error loading real-time component:', error);
      this.isLoaded = true; // Show fallback
    }
  }
}
