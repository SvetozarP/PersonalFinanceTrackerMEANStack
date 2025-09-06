import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { 
  RealtimeBudgetProgress, 
  CategoryProgress, 
  BudgetAlert, 
  RealtimeBudgetStats 
} from '../../../../core/services/realtime-budget-progress.service';
import { RealtimeBudgetProgressService } from '../../../../core/services/realtime-budget-progress.service';

@Component({
  selector: 'app-realtime-budget-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './realtime-budget-progress.component.html',
  styleUrls: ['./realtime-budget-progress.component.scss']
})
export class RealtimeBudgetProgressComponent implements OnInit, OnDestroy {
  @Input() budgetId?: string;
  @Input() showAlerts: boolean = true;
  @Input() showStats: boolean = true;
  @Input() compact: boolean = false;
  @Input() autoRefresh: boolean = true;
  
  @Output() budgetClick = new EventEmitter<RealtimeBudgetProgress>();
  @Output() categoryClick = new EventEmitter<{ budget: RealtimeBudgetProgress; category: CategoryProgress }>();
  @Output() alertClick = new EventEmitter<BudgetAlert>();

  private destroy$ = new Subject<void>();
  private realtimeService = inject(RealtimeBudgetProgressService);

  // Data
  budgetProgress: RealtimeBudgetProgress[] = [];
  budgetStats: RealtimeBudgetStats | null = null;
  alerts: BudgetAlert[] = [];
  isConnected = false;
  isLoading = false;

  // Animation states
  progressAnimations: Map<string, number> = new Map();
  alertAnimations: Map<string, boolean> = new Map();

  ngOnInit(): void {
    this.loadData();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.isLoading = true;
    
    combineLatest([
      this.realtimeService.getRealtimeProgress(),
      this.realtimeService.getBudgetStats(),
      this.realtimeService.getAlerts(),
      this.realtimeService.getConnectionStatus()
    ])
    .pipe(takeUntil(this.destroy$))
    .subscribe(([progress, stats, alerts, connected]) => {
      this.budgetProgress = this.budgetId ? 
        progress.filter(p => p.budgetId === this.budgetId) : 
        progress;
      this.budgetStats = stats;
      this.alerts = alerts;
      this.isConnected = connected;
      this.isLoading = false;
      
      this.animateProgressBars();
      this.animateAlerts();
    });
  }

  private setupSubscriptions(): void {
    if (this.autoRefresh) {
      this.realtimeService.getRealtimeProgress()
        .pipe(takeUntil(this.destroy$))
        .subscribe(progress => {
          this.budgetProgress = this.budgetId ? 
            progress.filter(p => p.budgetId === this.budgetId) : 
            progress;
          this.animateProgressBars();
        });
    }
  }

  private animateProgressBars(): void {
    // Simplified animation to reduce bundle size
    this.budgetProgress.forEach(budget => {
      this.progressAnimations.set(budget.budgetId, budget.progressPercentage);
      
      budget.categoryProgress.forEach(category => {
        const categoryKey = `${budget.budgetId}-${category.categoryId}`;
        this.progressAnimations.set(categoryKey, category.progressPercentage);
      });
    });
  }

  // Removed complex animation to reduce bundle size

  private animateAlerts(): void {
    this.alerts.forEach(alert => {
      if (!alert.acknowledged) {
        this.alertAnimations.set(alert.id, true);
        setTimeout(() => {
          this.alertAnimations.set(alert.id, false);
        }, 2000);
      }
    });
  }

  // Event handlers
  onBudgetClick(budget: RealtimeBudgetProgress): void {
    this.budgetClick.emit(budget);
  }

  onCategoryClick(budget: RealtimeBudgetProgress, category: CategoryProgress): void {
    this.categoryClick.emit({ budget, category });
  }

  onAlertClick(alert: BudgetAlert): void {
    this.alertClick.emit(alert);
  }

  onAcknowledgeAlert(alertId: string): void {
    this.realtimeService.acknowledgeAlert(alertId);
  }

  onRefresh(): void {
    this.realtimeService.refreshData();
  }

  // Helper methods
  getProgressValue(budgetId: string): number {
    return this.progressAnimations.get(budgetId) || 0;
  }

  getCategoryProgressValue(budgetId: string, categoryId: string): number {
    const key = `${budgetId}-${categoryId}`;
    return this.progressAnimations.get(key) || 0;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'under': return 'status-under';
      case 'at': return 'status-at';
      case 'over': return 'status-over';
      case 'critical': return 'status-critical';
      default: return 'status-unknown';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'under': return 'fas fa-check-circle';
      case 'at': return 'fas fa-exclamation-triangle';
      case 'over': return 'fas fa-times-circle';
      case 'critical': return 'fas fa-exclamation-circle';
      default: return 'fas fa-question-circle';
    }
  }

  getProgressBarClass(percentage: number, status: string): string {
    const baseClass = 'progress-fill';
    const statusClass = this.getStatusClass(status);
    const animationClass = percentage > 0 ? 'animated' : '';
    return `${baseClass} ${statusClass} ${animationClass}`.trim();
  }

  getAlertClass(alert: BudgetAlert): string {
    const baseClass = 'alert-item';
    const typeClass = `alert-${alert.type}`;
    const animationClass = this.alertAnimations.get(alert.id) ? 'pulse' : '';
    const acknowledgedClass = alert.acknowledged ? 'acknowledged' : '';
    return `${baseClass} ${typeClass} ${animationClass} ${acknowledgedClass}`.trim();
  }

  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'increasing': return 'fas fa-arrow-up';
      case 'decreasing': return 'fas fa-arrow-down';
      case 'stable': return 'fas fa-minus';
      default: return 'fas fa-question';
    }
  }

  getTrendClass(trend: string): string {
    switch (trend) {
      case 'increasing': return 'trend-increasing';
      case 'decreasing': return 'trend-decreasing';
      case 'stable': return 'trend-stable';
      default: return 'trend-unknown';
    }
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatPercentage(percentage: number): string {
    return `${percentage.toFixed(1)}%`;
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  // Filter methods
  getUnacknowledgedAlerts(): BudgetAlert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  getCriticalAlerts(): BudgetAlert[] {
    return this.alerts.filter(alert => alert.type === 'critical' && !alert.acknowledged);
  }

  getWarningAlerts(): BudgetAlert[] {
    return this.alerts.filter(alert => alert.type === 'warning' && !alert.acknowledged);
  }

  // Statistics helpers
  getOnTrackCount(): number {
    return this.budgetProgress.filter(b => b.status === 'under').length;
  }

  getAtThresholdCount(): number {
    return this.budgetProgress.filter(b => b.status === 'at').length;
  }

  getOverBudgetCount(): number {
    return this.budgetProgress.filter(b => b.status === 'over').length;
  }

  getCriticalCount(): number {
    return this.budgetProgress.filter(b => b.status === 'critical').length;
  }
}
