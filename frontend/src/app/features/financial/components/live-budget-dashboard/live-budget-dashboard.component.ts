import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { 
  RealtimeBudgetProgress, 
  RealtimeBudgetStats, 
  BudgetAlert 
} from '../../../../core/services/realtime-budget-progress.service';
import { RealtimeBudgetProgressService } from '../../../../core/services/realtime-budget-progress.service';
import { BudgetNotificationService } from '../../../../core/services/budget-notification.service';

@Component({
  selector: 'app-live-budget-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './live-budget-dashboard.component.html',
  styleUrls: ['./live-budget-dashboard.component.scss']
})
export class LiveBudgetDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private realtimeService = inject(RealtimeBudgetProgressService);
  private notificationService = inject(BudgetNotificationService);

  // Data
  budgetProgress: RealtimeBudgetProgress[] = [];
  budgetStats: RealtimeBudgetStats | null = null;
  alerts: BudgetAlert[] = [];
  notifications: BudgetAlert[] = [];
  isConnected = false;
  isLoading = false;

  // UI State
  selectedTimeRange: '1h' | '6h' | '24h' | '7d' = '24h';
  selectedView: 'overview' | 'detailed' | 'alerts' = 'overview';
  showSettings = false;

  // Animation states
  chartAnimations: Map<string, number> = new Map();
  pulseAnimations: Set<string> = new Set();

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
      this.realtimeService.getConnectionStatus(),
      this.notificationService.getNotifications()
    ])
    .pipe(takeUntil(this.destroy$))
    .subscribe(([progress, stats, alerts, connected, notifications]) => {
      this.budgetProgress = progress;
      this.budgetStats = stats;
      this.alerts = alerts;
      this.notifications = notifications;
      this.isConnected = connected;
      this.isLoading = false;
      
      this.animateCharts();
      this.triggerPulseAnimations();
    });
  }

  private setupSubscriptions(): void {
    // Real-time updates
    this.realtimeService.getRealtimeProgress()
      .pipe(takeUntil(this.destroy$))
      .subscribe(progress => {
        this.budgetProgress = progress;
        this.animateCharts();
      });

    // Alert updates
    this.realtimeService.getAlerts()
      .pipe(takeUntil(this.destroy$))
      .subscribe(alerts => {
        this.alerts = alerts;
        this.triggerPulseAnimations();
      });
  }

  private animateCharts(): void {
    this.budgetProgress.forEach(budget => {
      const key = `budget-${budget.budgetId}`;
      const currentValue = this.chartAnimations.get(key) || 0;
      const targetValue = budget.progressPercentage;
      
      if (Math.abs(currentValue - targetValue) > 0.1) {
        this.animateChartValue(key, currentValue, targetValue);
      }
    });
  }

  // Simplified animation to reduce bundle size
  private animateChartValue(key: string, from: number, to: number): void {
    this.chartAnimations.set(key, to);
  }

  private triggerPulseAnimations(): void {
    this.alerts.forEach(alert => {
      if (!alert.acknowledged) {
        this.pulseAnimations.add(alert.id);
        setTimeout(() => {
          this.pulseAnimations.delete(alert.id);
        }, 2000);
      }
    });
  }

  // Event handlers
  onTimeRangeChange(timeRange: '1h' | '6h' | '24h' | '7d'): void {
    this.selectedTimeRange = timeRange;
    // Trigger data refresh based on time range
    this.realtimeService.refreshData();
  }

  onViewChange(view: 'overview' | 'detailed' | 'alerts'): void {
    this.selectedView = view;
  }

  onToggleSettings(): void {
    this.showSettings = !this.showSettings;
  }

  onAcknowledgeAlert(alertId: string): void {
    this.realtimeService.acknowledgeAlert(alertId);
    this.notificationService.markAsRead(alertId);
  }

  onClearAllAlerts(): void {
    this.realtimeService.clearAllAlerts();
    this.notificationService.clearAllNotifications();
  }

  onRefresh(): void {
    this.realtimeService.refreshData();
  }

  // Helper methods
  getChartValue(budgetId: string): number {
    const key = `budget-${budgetId}`;
    return this.chartAnimations.get(key) || 0;
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

  getAlertClass(alert: BudgetAlert): string {
    const baseClass = 'alert-item';
    const typeClass = `alert-${alert.type}`;
    const pulseClass = this.pulseAnimations.has(alert.id) ? 'pulse' : '';
    const acknowledgedClass = alert.acknowledged ? 'acknowledged' : '';
    return `${baseClass} ${typeClass} ${pulseClass} ${acknowledgedClass}`.trim();
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
  getCriticalAlerts(): BudgetAlert[] {
    return this.alerts.filter(alert => alert.type === 'critical' && !alert.acknowledged);
  }

  getWarningAlerts(): BudgetAlert[] {
    return this.alerts.filter(alert => alert.type === 'warning' && !alert.acknowledged);
  }

  getUnacknowledgedAlerts(): BudgetAlert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
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

  // Chart data helpers
  getBudgetChartData(): any[] {
    return this.budgetProgress.map(budget => ({
      name: budget.budgetName,
      value: this.getChartValue(budget.budgetId),
      status: budget.status,
      spent: budget.spentAmount,
      total: budget.totalAmount
    }));
  }

  getCategoryChartData(budgetId: string): any[] {
    const budget = this.budgetProgress.find(b => b.budgetId === budgetId);
    if (!budget) return [];
    
    return budget.categoryProgress.map(category => ({
      name: category.categoryName,
      value: category.progressPercentage,
      status: category.status,
      spent: category.spentAmount,
      allocated: category.allocatedAmount
    }));
  }

  // Progress calculation helpers
  getOverallProgress(): number {
    if (!this.budgetStats) return 0;
    return this.budgetStats.overallProgress;
  }

  getAverageProgress(): number {
    if (!this.budgetStats) return 0;
    return this.budgetStats.averageProgress;
  }

  getTotalSpent(): number {
    if (!this.budgetStats) return 0;
    return this.budgetStats.totalSpent;
  }

  getTotalBudget(): number {
    if (!this.budgetStats) return 0;
    return this.budgetStats.totalBudget;
  }

  getRemainingAmount(): number {
    return this.getTotalBudget() - this.getTotalSpent();
  }

  // Trend analysis
  getSpendingTrend(): 'increasing' | 'decreasing' | 'stable' {
    // This would typically analyze historical data
    // For now, return a mock trend
    return 'stable';
  }

  getProjectedOverspend(): boolean {
    return this.budgetProgress.some(budget => 
      budget.categoryProgress.some(category => category.projectedOverspend)
    );
  }

  // Alert management
  getAlertCount(): number {
    return this.getUnacknowledgedAlerts().length;
  }

  getCriticalAlertCount(): number {
    return this.getCriticalAlerts().length;
  }

  hasNewAlerts(): boolean {
    return this.getUnacknowledgedAlerts().length > 0;
  }
}
