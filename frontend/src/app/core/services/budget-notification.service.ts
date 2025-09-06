import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BudgetAlert } from './realtime-budget-progress.service';

export interface NotificationSettings {
  enablePushNotifications: boolean;
  enableEmailNotifications: boolean;
  enableInAppNotifications: boolean;
  criticalThreshold: number;
  warningThreshold: number;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
  notificationTypes: {
    budgetOverrun: boolean;
    budgetThreshold: boolean;
    projectedOverspend: boolean;
    categoryOverrun: boolean;
    dailyDigest: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class BudgetNotificationService {
  private notifications$ = new BehaviorSubject<BudgetAlert[]>([]);
  private settings$ = new BehaviorSubject<NotificationSettings>(this.getDefaultSettings());
  private unreadCount$ = new BehaviorSubject<number>(0);

  constructor() {
    this.loadSettings();
    this.setupNotificationPermission();
  }

  // Public observables
  getNotifications(): Observable<BudgetAlert[]> {
    return this.notifications$.asObservable();
  }

  getSettings(): Observable<NotificationSettings> {
    return this.settings$.asObservable();
  }

  getUnreadCount(): Observable<number> {
    return this.unreadCount$.asObservable();
  }

  // Notification management
  addNotification(alert: BudgetAlert): void {
    const currentNotifications = this.notifications$.value;
    const updatedNotifications = [alert, ...currentNotifications];
    
    // Keep only last 50 notifications
    if (updatedNotifications.length > 50) {
      updatedNotifications.splice(50);
    }
    
    this.notifications$.next(updatedNotifications);
    this.updateUnreadCount();
    
    // Show browser notification if enabled
    if (this.shouldShowNotification(alert)) {
      this.showBrowserNotification(alert);
    }
  }

  markAsRead(alertId: string): void {
    const currentNotifications = this.notifications$.value;
    const updatedNotifications = currentNotifications.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    );
    
    this.notifications$.next(updatedNotifications);
    this.updateUnreadCount();
  }

  markAllAsRead(): void {
    const currentNotifications = this.notifications$.value;
    const updatedNotifications = currentNotifications.map(alert => 
      ({ ...alert, acknowledged: true })
    );
    
    this.notifications$.next(updatedNotifications);
    this.updateUnreadCount();
  }

  clearNotification(alertId: string): void {
    const currentNotifications = this.notifications$.value;
    const updatedNotifications = currentNotifications.filter(alert => alert.id !== alertId);
    
    this.notifications$.next(updatedNotifications);
    this.updateUnreadCount();
  }

  clearAllNotifications(): void {
    this.notifications$.next([]);
    this.updateUnreadCount();
  }

  // Settings management
  updateSettings(settings: Partial<NotificationSettings>): void {
    const currentSettings = this.settings$.value;
    const updatedSettings = { ...currentSettings, ...settings };
    
    this.settings$.next(updatedSettings);
    this.saveSettings(updatedSettings);
  }

  // Notification creation helpers
  createBudgetOverrunAlert(budgetName: string, percentage: number): BudgetAlert {
    return {
      id: `budget-overrun-${Date.now()}`,
      type: 'critical',
      message: `Budget overrun: ${budgetName} is at ${percentage.toFixed(1)}%`,
      threshold: 100,
      currentValue: percentage,
      timestamp: new Date(),
      acknowledged: false
    };
  }

  createBudgetThresholdAlert(budgetName: string, percentage: number, threshold: number): BudgetAlert {
    return {
      id: `budget-threshold-${Date.now()}`,
      type: 'warning',
      message: `Budget threshold: ${budgetName} reached ${percentage.toFixed(1)}% (${threshold}% threshold)`,
      threshold,
      currentValue: percentage,
      timestamp: new Date(),
      acknowledged: false
    };
  }

  createCategoryOverrunAlert(budgetName: string, categoryName: string, percentage: number): BudgetAlert {
    return {
      id: `category-overrun-${Date.now()}`,
      type: 'critical',
      message: `Category overrun: ${categoryName} in ${budgetName} is at ${percentage.toFixed(1)}%`,
      categoryName,
      threshold: 100,
      currentValue: percentage,
      timestamp: new Date(),
      acknowledged: false
    };
  }

  createProjectedOverspendAlert(budgetName: string, categoryName: string): BudgetAlert {
    return {
      id: `projected-overspend-${Date.now()}`,
      type: 'warning',
      message: `Projected overspend: ${categoryName} in ${budgetName} is on track to exceed budget`,
      categoryName,
      timestamp: new Date(),
      acknowledged: false
    };
  }

  createDailyDigestAlert(summary: {
    totalBudgets: number;
    onTrack: number;
    overBudget: number;
    critical: number;
  }): BudgetAlert {
    return {
      id: `daily-digest-${Date.now()}`,
      type: 'info',
      message: `Daily digest: ${summary.onTrack}/${summary.totalBudgets} budgets on track, ${summary.overBudget} over budget, ${summary.critical} critical`,
      timestamp: new Date(),
      acknowledged: false
    };
  }

  // Private methods
  private getDefaultSettings(): NotificationSettings {
    return {
      enablePushNotifications: true,
      enableEmailNotifications: false,
      enableInAppNotifications: true,
      criticalThreshold: 90,
      warningThreshold: 75,
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00'
      },
      notificationTypes: {
        budgetOverrun: true,
        budgetThreshold: true,
        projectedOverspend: true,
        categoryOverrun: true,
        dailyDigest: true
      }
    };
  }

  private loadSettings(): void {
    const savedSettings = localStorage.getItem('budget-notification-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        this.settings$.next({ ...this.getDefaultSettings(), ...settings });
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    }
  }

  private saveSettings(settings: NotificationSettings): void {
    localStorage.setItem('budget-notification-settings', JSON.stringify(settings));
  }

  private updateUnreadCount(): void {
    const unreadCount = this.notifications$.value.filter(alert => !alert.acknowledged).length;
    this.unreadCount$.next(unreadCount);
  }

  private shouldShowNotification(alert: BudgetAlert): boolean {
    const settings = this.settings$.value;
    
    if (!settings.enableInAppNotifications) return false;
    if (!settings.enablePushNotifications) return false;
    
    // Check quiet hours
    if (settings.quietHours.enabled && this.isInQuietHours()) {
      return false;
    }
    
    // Check notification type settings
    switch (alert.type) {
      case 'critical':
        return settings.notificationTypes.budgetOverrun || settings.notificationTypes.categoryOverrun;
      case 'warning':
        return settings.notificationTypes.budgetThreshold || settings.notificationTypes.projectedOverspend;
      case 'info':
        return settings.notificationTypes.dailyDigest;
      default:
        return true;
    }
  }

  private isInQuietHours(): boolean {
    const settings = this.settings$.value;
    if (!settings.quietHours.enabled) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const startTime = this.parseTime(settings.quietHours.start);
    const endTime = this.parseTime(settings.quietHours.end);
    
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private async setupNotificationPermission(): Promise<void> {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }
  }

  private showBrowserNotification(alert: BudgetAlert): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('Budget Alert', {
        body: alert.message,
        icon: '/assets/icons/budget-icon.png',
        badge: '/assets/icons/badge-icon.png',
        tag: alert.id,
        requireInteraction: alert.type === 'critical',
        silent: false
      });

      notification.onclick = () => {
        window.focus();
        this.markAsRead(alert.id);
        notification.close();
      };

      // Auto-close after 5 seconds for non-critical alerts
      if (alert.type !== 'critical') {
        setTimeout(() => notification.close(), 5000);
      }
    }
  }

  // Utility methods
  getNotificationIcon(type: string): string {
    switch (type) {
      case 'critical': return 'fas fa-exclamation-circle';
      case 'warning': return 'fas fa-exclamation-triangle';
      case 'info': return 'fas fa-info-circle';
      case 'success': return 'fas fa-check-circle';
      default: return 'fas fa-bell';
    }
  }

  getNotificationColor(type: string): string {
    switch (type) {
      case 'critical': return '#dc3545';
      case 'warning': return '#ffc107';
      case 'info': return '#17a2b8';
      case 'success': return '#28a745';
      default: return '#6c757d';
    }
  }

  formatNotificationTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }
}
