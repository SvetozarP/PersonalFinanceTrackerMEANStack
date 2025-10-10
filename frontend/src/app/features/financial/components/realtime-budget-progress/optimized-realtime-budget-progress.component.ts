import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { RealtimeBudgetProgressService } from '../../../../core/services/realtime-budget-progress.service';

// Simplified interfaces to reduce bundle size
interface SimpleBudgetProgress {
  budgetId: string;
  budgetName: string;
  totalAmount: number;
  spentAmount: number;
  progressPercentage: number;
  status: 'under' | 'at' | 'over' | 'critical';
  daysRemaining: number;
  currency: string; // Add currency field
}

interface SimpleBudgetStats {
  totalBudgets: number;
  totalSpent: number;
  totalBudget: number;
  overallProgress: number;
}

@Component({
  selector: 'app-optimized-realtime-budget-progress',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="optimized-realtime-progress" [class.compact]="compact">
      <!-- Connection Status -->
      <div class="connection-status" *ngIf="!compact">
        <div class="status-indicator" [class.connected]="isConnected">
          <i class="fas fa-wifi"></i>
          <span>{{ isConnected ? 'Connected' : 'Disconnected' }}</span>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading">
        <div class="loading-content">
          <div class="spinner"></div>
          <p>Loading budget data...</p>
        </div>
      </div>

      <!-- Budget Statistics -->
      <div class="budget-stats" *ngIf="showStats && budgetStats && !compact">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-wallet"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ formatCurrency(budgetStats.totalBudget, 'USD') }}</div>
              <div class="stat-label">Total Budget</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-shopping-cart"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ formatCurrency(budgetStats.totalSpent, 'USD') }}</div>
              <div class="stat-label">Total Spent</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-chart-pie"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ formatPercentage(budgetStats.overallProgress) }}</div>
              <div class="stat-label">Progress</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Budget Progress List -->
      <div class="budget-progress-list" *ngIf="budgetProgress.length > 0">
        <div 
          *ngFor="let budget of budgetProgress; trackBy: trackByBudgetId" 
          class="budget-progress-item"
          [ngClass]="getStatusClass(budget.status)"
          (click)="onBudgetClick(budget)">
          
          <div class="budget-header">
            <div class="budget-info">
              <h4>{{ budget.budgetName }}</h4>
              <div class="budget-meta">
                <span class="budget-period">{{ budget.daysRemaining }} days remaining</span>
                <span class="budget-status" [ngClass]="getStatusClass(budget.status)">
                  {{ budget.status | titlecase }}
                </span>
              </div>
            </div>
            
            <div class="budget-summary">
              <div class="budget-amounts">
                <span class="spent-amount">{{ formatCurrency(budget.spentAmount, budget.currency) }}</span>
                <span class="total-amount">of {{ formatCurrency(budget.totalAmount, budget.currency) }}</span>
              </div>
              <div class="budget-percentage">{{ formatPercentage(budget.progressPercentage) }}</div>
            </div>
          </div>

          <div class="budget-progress-bar">
            <div class="progress-bar">
              <div 
                class="progress-fill"
                [ngClass]="getStatusClass(budget.status)"
                [style.width.%]="budget.progressPercentage">
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Data State -->
      <div class="no-data" *ngIf="!isLoading && budgetProgress.length === 0">
        <div class="no-data-content">
          <i class="fas fa-chart-pie"></i>
          <h3>No Active Budgets</h3>
          <p>Create a budget to start tracking your spending</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .optimized-realtime-progress {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      margin-bottom: 24px;

      .connection-status {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 20px;
        background: #f8f9fa;
        border-bottom: 1px solid #e9ecef;

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;

          &.connected {
            color: #28a745;
          }

          &.disconnected {
            color: #dc3545;
          }
        }
      }

      .loading-state {
        padding: 60px 20px;
        text-align: center;

        .loading-content {
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
      }

      .budget-stats {
        padding: 20px;
        background: #f8f9fa;
        border-bottom: 1px solid #e9ecef;

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;

          .stat-card {
            background: white;
            border-radius: 8px;
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

            .stat-icon {
              width: 40px;
              height: 40px;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              color: white;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }

            .stat-content {
              flex: 1;

              .stat-value {
                font-size: 18px;
                font-weight: 700;
                color: #2c3e50;
                margin-bottom: 4px;
              }

              .stat-label {
                font-size: 12px;
                color: #6c757d;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
            }
          }
        }
      }

      .budget-progress-list {
        .budget-progress-item {
          padding: 20px;
          border-bottom: 1px solid #e9ecef;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            background: #f8f9fa;
          }

          &:last-child {
            border-bottom: none;
          }

          &.status-under {
            border-left: 4px solid #28a745;
          }

          &.status-at {
            border-left: 4px solid #ffc107;
          }

          &.status-over {
            border-left: 4px solid #dc3545;
          }

          &.status-critical {
            border-left: 4px solid #dc3545;
            background: #f8d7da;
          }

          .budget-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 16px;
            gap: 16px;

            .budget-info {
              flex: 1;

              .budget-name {
                margin: 0 0 8px 0;
                font-size: 18px;
                font-weight: 600;
                color: #2c3e50;
              }

              .budget-meta {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;

                .budget-period {
                  font-size: 14px;
                  color: #6c757d;
                }

                .budget-status {
                  font-size: 12px;
                  padding: 4px 8px;
                  border-radius: 12px;
                  font-weight: 500;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;

                  &.status-under {
                    background: #d4edda;
                    color: #155724;
                  }

                  &.status-at {
                    background: #fff3cd;
                    color: #856404;
                  }

                  &.status-over {
                    background: #f8d7da;
                    color: #721c24;
                  }

                  &.status-critical {
                    background: #f8d7da;
                    color: #721c24;
                  }
                }
              }
            }

            .budget-summary {
              text-align: right;

              .budget-amounts {
                display: flex;
                flex-direction: column;
                gap: 4px;
                margin-bottom: 8px;

                .spent-amount {
                  font-size: 20px;
                  font-weight: 700;
                  color: #2c3e50;
                }

                .total-amount {
                  font-size: 14px;
                  color: #6c757d;
                }
              }

              .budget-percentage {
                font-size: 16px;
                font-weight: 600;
                color: #2c3e50;
              }
            }
          }

          .budget-progress-bar {
            .progress-bar {
              width: 100%;
              height: 8px;
              background: #e9ecef;
              border-radius: 4px;
              overflow: hidden;

              .progress-fill {
                height: 100%;
                border-radius: 4px;
                transition: width 0.3s ease;

                &.status-under {
                  background: #28a745;
                }

                &.status-at {
                  background: #ffc107;
                }

                &.status-over {
                  background: #dc3545;
                }

                &.status-critical {
                  background: #dc3545;
                }
              }
            }
          }
        }
      }

      .no-data {
        padding: 60px 20px;
        text-align: center;

        .no-data-content {
          i {
            font-size: 48px;
            color: #dee2e6;
            margin-bottom: 16px;
          }

          h3 {
            margin: 0 0 8px 0;
            font-size: 18px;
            font-weight: 600;
            color: #6c757d;
          }

          p {
            margin: 0;
            color: #6c757d;
            font-size: 14px;
          }
        }
      }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class OptimizedRealtimeBudgetProgressComponent implements OnInit, OnDestroy {
  @Input() showAlerts: boolean = true;
  @Input() showStats: boolean = true;
  @Input() compact: boolean = false;
  @Input() autoRefresh: boolean = true;
  
  @Output() budgetClick = new EventEmitter<SimpleBudgetProgress>();
  @Output() categoryClick = new EventEmitter<any>();
  @Output() alertClick = new EventEmitter<any>();

  private destroy$ = new Subject<void>();
  private realtimeService = inject(RealtimeBudgetProgressService);
  private cdr = inject(ChangeDetectorRef);

  // Data
  budgetProgress: SimpleBudgetProgress[] = [];
  budgetStats: SimpleBudgetStats | null = null;
  isConnected = false;
  isLoading = false;

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    
    this.realtimeService.getRealtimeProgress()
      .pipe(takeUntil(this.destroy$))
      .subscribe(progress => {
        this.budgetProgress = progress.map(p => ({
          budgetId: p.budgetId,
          budgetName: p.budgetName,
          totalAmount: p.totalAmount,
          spentAmount: p.spentAmount,
          progressPercentage: p.progressPercentage,
          status: p.status,
          daysRemaining: p.daysRemaining,
          currency: p.currency // Add currency field
        }));
        this.isLoading = false;
        this.cdr.markForCheck();
      });

    this.realtimeService.getBudgetStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        if (stats) {
          this.budgetStats = {
            totalBudgets: stats.totalBudgets,
            totalSpent: stats.totalSpent,
            totalBudget: stats.totalBudget,
            overallProgress: stats.overallProgress
          };
          this.cdr.markForCheck();
        }
      });

    this.realtimeService.getConnectionStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe(connected => {
        this.isConnected = connected;
        this.cdr.markForCheck();
      });
  }

  // Event handlers
  onBudgetClick(budget: SimpleBudgetProgress): void {
    this.budgetClick.emit(budget);
  }

  // TrackBy function for performance
  trackByBudgetId(index: number, budget: SimpleBudgetProgress): string {
    return budget.budgetId;
  }

  // Helper methods
  getStatusClass(status: string): string {
    switch (status) {
      case 'under': return 'status-under';
      case 'at': return 'status-at';
      case 'over': return 'status-over';
      case 'critical': return 'status-critical';
      default: return 'status-unknown';
    }
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    // Use a more stable formatting approach
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatPercentage(percentage: number): string {
    if (percentage === null || percentage === undefined || isNaN(percentage)) {
      return '0.0%';
    }
    return `${Math.round(percentage * 10) / 10}%`;
  }
}
