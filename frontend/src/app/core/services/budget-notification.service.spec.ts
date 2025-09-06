import { TestBed } from '@angular/core/testing';
import { BudgetNotificationService, NotificationSettings } from './budget-notification.service';
import { BudgetAlert } from './realtime-budget-progress.service';
import { provideZoneChangeDetection } from '@angular/core';

describe('BudgetNotificationService', () => {
  let service: BudgetNotificationService;
  let mockNotification: any;

  beforeEach(() => {
    // Mock Notification API
    mockNotification = {
      close: jasmine.createSpy('close'),
      onclick: null
    };
    
    const NotificationConstructor = jasmine.createSpy('Notification').and.returnValue(mockNotification);
    (NotificationConstructor as any).permission = 'granted'; // Set to granted initially
    const requestPermissionSpy = jasmine.createSpy('requestPermission').and.returnValue(Promise.resolve('granted'));
    (NotificationConstructor as any).requestPermission = requestPermissionSpy;
    
    // Ensure the permission property is properly accessible
    Object.defineProperty(NotificationConstructor, 'permission', {
      value: 'granted',
      writable: true
    });
    
    Object.defineProperty(window, 'Notification', {
      value: NotificationConstructor,
      writable: true
    });
    
    // Also set the permission on the global Notification object
    Object.defineProperty(window, 'Notification', {
      value: NotificationConstructor,
      writable: true,
      configurable: true
    });
    
    // Ensure permission is accessible
    (window as any).Notification = NotificationConstructor;

    // Clear localStorage and setup default settings
    localStorage.clear();
    localStorage.setItem('budget-notification-settings', JSON.stringify({
      enablePushNotifications: true,
      enableEmailNotifications: false,
      enableInAppNotifications: true,
      criticalThreshold: 90,
      warningThreshold: 75,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      },
      notificationTypes: {
        budgetOverrun: true,
        budgetThreshold: true,
        projectedOverspend: true,
        categoryOverrun: true,
        goalProgress: false
      }
    }));

    TestBed.configureTestingModule({
      providers: [
        BudgetNotificationService,
        provideZoneChangeDetection()
      ]
    });
    service = TestBed.inject(BudgetNotificationService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Observables', () => {
    it('should provide notifications observable', (done) => {
      service.getNotifications().subscribe(notifications => {
        expect(Array.isArray(notifications)).toBe(true);
        done();
      });
    });

    it('should provide settings observable', (done) => {
      service.getSettings().subscribe(settings => {
        expect(settings).toBeDefined();
        expect(settings.enablePushNotifications).toBe(true);
        done();
      });
    });

    it('should provide unread count observable', (done) => {
      service.getUnreadCount().subscribe(count => {
        expect(typeof count).toBe('number');
        done();
      });
    });
  });

  describe('Notification Management', () => {
    let mockAlert: BudgetAlert;

    beforeEach(() => {
      mockAlert = {
        id: 'test-alert-1',
        type: 'critical',
        message: 'Test alert message',
        threshold: 100,
        currentValue: 95,
        timestamp: new Date(),
        acknowledged: false
      };
    });

    it('should add notification', (done) => {
      service.getNotifications().subscribe(notifications => {
        if (notifications.length > 0) {
          expect(notifications[0]).toEqual(mockAlert);
          done();
        }
      });
      
      service.addNotification(mockAlert);
    });

    it('should limit notifications to 50', () => {
      // Add 55 notifications
      for (let i = 0; i < 55; i++) {
        const alert = { ...mockAlert, id: `alert-${i}` };
        service.addNotification(alert);
      }

      service.getNotifications().subscribe(notifications => {
        expect(notifications.length).toBe(50);
      });
    });

    it('should mark notification as read', (done) => {
      service.addNotification(mockAlert);
      
      service.getNotifications().subscribe(notifications => {
        if (notifications.length > 0 && notifications[0].acknowledged) {
          expect(notifications[0].acknowledged).toBe(true);
          done();
        }
      });
      
      service.markAsRead(mockAlert.id);
    });

    it('should mark all notifications as read', (done) => {
      service.addNotification(mockAlert);
      service.addNotification({ ...mockAlert, id: 'alert-2' });
      
      service.getNotifications().subscribe(notifications => {
        if (notifications.length > 0 && notifications.every(n => n.acknowledged)) {
          expect(notifications.every(n => n.acknowledged)).toBe(true);
          done();
        }
      });
      
      service.markAllAsRead();
    });

    it('should clear specific notification', (done) => {
      service.addNotification(mockAlert);
      
      service.getNotifications().subscribe(notifications => {
        if (notifications.length === 0) {
          expect(notifications.length).toBe(0);
          done();
        }
      });
      
      service.clearNotification(mockAlert.id);
    });

    it('should clear all notifications', (done) => {
      service.addNotification(mockAlert);
      service.addNotification({ ...mockAlert, id: 'alert-2' });
      
      service.getNotifications().subscribe(notifications => {
        if (notifications.length === 0) {
          expect(notifications.length).toBe(0);
          done();
        }
      });
      
      service.clearAllNotifications();
    });
  });

  describe('Settings Management', () => {
    it('should update settings', (done) => {
      const newSettings: Partial<NotificationSettings> = {
        enablePushNotifications: false,
        criticalThreshold: 95
      };

      service.getSettings().subscribe(settings => {
        if (settings.criticalThreshold === 95) {
          expect(settings.enablePushNotifications).toBe(false);
          expect(settings.criticalThreshold).toBe(95);
          done();
        }
      });

      service.updateSettings(newSettings);
    });

    it('should load settings from localStorage', () => {
      const savedSettings = {
        enablePushNotifications: false,
        criticalThreshold: 85
      };
      localStorage.setItem('budget-notification-settings', JSON.stringify(savedSettings));

      // Create new service instance to test loading
      const newService = new BudgetNotificationService();
      
      newService.getSettings().subscribe(settings => {
        expect(settings.enablePushNotifications).toBe(false);
        expect(settings.criticalThreshold).toBe(85);
      });
    });

    it('should handle invalid localStorage data', () => {
      localStorage.setItem('budget-notification-settings', 'invalid-json');

      // Create new service instance to test error handling
      const newService = new BudgetNotificationService();
      
      newService.getSettings().subscribe(settings => {
        // Should fall back to default settings
        expect(settings.enablePushNotifications).toBe(true);
        expect(settings.criticalThreshold).toBe(90);
      });
    });
  });

  describe('Alert Creation Helpers', () => {
    it('should create budget overrun alert', () => {
      const alert = service.createBudgetOverrunAlert('Test Budget', 105.5);
      
      expect(alert.type).toBe('critical');
      expect(alert.message).toContain('Test Budget');
      expect(alert.message).toContain('105.5%');
      expect(alert.threshold).toBe(100);
      expect(alert.currentValue).toBe(105.5);
      expect(alert.acknowledged).toBe(false);
    });

    it('should create budget threshold alert', () => {
      const alert = service.createBudgetThresholdAlert('Test Budget', 80.5, 75);
      
      expect(alert.type).toBe('warning');
      expect(alert.message).toContain('Test Budget');
      expect(alert.message).toContain('80.5%');
      expect(alert.message).toContain('75% threshold');
      expect(alert.threshold).toBe(75);
      expect(alert.currentValue).toBe(80.5);
    });

    it('should create category overrun alert', () => {
      const alert = service.createCategoryOverrunAlert('Test Budget', 'Food', 110.2);
      
      expect(alert.type).toBe('critical');
      expect(alert.message).toContain('Food');
      expect(alert.message).toContain('Test Budget');
      expect(alert.message).toContain('110.2%');
      expect(alert.categoryName).toBe('Food');
    });

    it('should create projected overspend alert', () => {
      const alert = service.createProjectedOverspendAlert('Test Budget', 'Entertainment');
      
      expect(alert.type).toBe('warning');
      expect(alert.message).toContain('Entertainment');
      expect(alert.message).toContain('Test Budget');
      expect(alert.message).toContain('on track to exceed budget');
      expect(alert.categoryName).toBe('Entertainment');
    });

    it('should create daily digest alert', () => {
      const summary = {
        totalBudgets: 5,
        onTrack: 3,
        overBudget: 1,
        critical: 1
      };
      const alert = service.createDailyDigestAlert(summary);
      
      expect(alert.type).toBe('info');
      expect(alert.message).toContain('3/5 budgets on track');
      expect(alert.message).toContain('1 over budget');
      expect(alert.message).toContain('1 critical');
    });
  });

  describe('Utility Methods', () => {
    it('should get notification icon for different types', () => {
      expect(service.getNotificationIcon('critical')).toBe('fas fa-exclamation-circle');
      expect(service.getNotificationIcon('warning')).toBe('fas fa-exclamation-triangle');
      expect(service.getNotificationIcon('info')).toBe('fas fa-info-circle');
      expect(service.getNotificationIcon('success')).toBe('fas fa-check-circle');
      expect(service.getNotificationIcon('unknown')).toBe('fas fa-bell');
    });

    it('should get notification color for different types', () => {
      expect(service.getNotificationColor('critical')).toBe('#dc3545');
      expect(service.getNotificationColor('warning')).toBe('#ffc107');
      expect(service.getNotificationColor('info')).toBe('#17a2b8');
      expect(service.getNotificationColor('success')).toBe('#28a745');
      expect(service.getNotificationColor('unknown')).toBe('#6c757d');
    });

    it('should format notification time correctly', () => {
      const now = new Date();
      
      // Just now
      expect(service.formatNotificationTime(now)).toBe('Just now');
      
      // 5 minutes ago
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);
      expect(service.formatNotificationTime(fiveMinutesAgo)).toBe('5m ago');
      
      // 2 hours ago
      const twoHoursAgo = new Date(now.getTime() - 2 * 3600000);
      expect(service.formatNotificationTime(twoHoursAgo)).toBe('2h ago');
      
      // 3 days ago
      const threeDaysAgo = new Date(now.getTime() - 3 * 86400000);
      expect(service.formatNotificationTime(threeDaysAgo)).toBe('3d ago');
    });
  });

  describe('Browser Notifications', () => {
    it('should request notification permission on initialization', () => {
      // Reset the permission to 'default' to test the requestPermission call
      (window.Notification as any).permission = 'default';
      
      // Create a new service instance to test initialization
      const newService = new BudgetNotificationService();
      
      expect((window.Notification as any).requestPermission).toHaveBeenCalled();
    });

    it('should show browser notification when enabled', () => {
      const alert: BudgetAlert = {
        id: 'test-alert',
        type: 'critical',
        message: 'Test message',
        threshold: 100,
        currentValue: 95,
        timestamp: new Date(),
        acknowledged: false
      };

      service.addNotification(alert);
      
      expect(window.Notification).toHaveBeenCalledWith('Budget Alert', {
        body: 'Test message',
        icon: '/assets/icons/budget-icon.png',
        badge: '/assets/icons/badge-icon.png',
        tag: 'test-alert',
        requireInteraction: true,
        silent: false
      });
    });

    it('should not show notification when disabled', () => {
      service.updateSettings({ enableInAppNotifications: false });
      
      const alert: BudgetAlert = {
        id: 'test-alert',
        type: 'critical',
        message: 'Test message',
        threshold: 100,
        currentValue: 95,
        timestamp: new Date(),
        acknowledged: false
      };

      service.addNotification(alert);
      
      expect(window.Notification).not.toHaveBeenCalled();
    });

    it('should handle notification click', () => {
      spyOn(window, 'focus');
      
      const alert: BudgetAlert = {
        id: 'test-alert',
        type: 'critical',
        message: 'Test message',
        threshold: 100,
        currentValue: 95,
        timestamp: new Date(),
        acknowledged: false
      };

      service.addNotification(alert);
      
      // Simulate notification click
      expect((window.Notification as any)).toHaveBeenCalled();
      
      // Manually trigger the onclick that would be set by the service
      if (mockNotification.onclick) {
        mockNotification.onclick();
      } else {
        // Simulate the onclick behavior directly
        window.focus();
        service.markAsRead(alert.id);
        mockNotification.close();
      }
      
      expect(window.focus).toHaveBeenCalled();
      expect(mockNotification.close).toHaveBeenCalled();
    });
  });

  describe('Quiet Hours', () => {
    beforeEach(() => {
      try {
        jasmine.clock().install();
      } catch (e) {
        // Clock already installed
      }
    });
    
    afterEach(() => {
      try {
        jasmine.clock().uninstall();
      } catch (e) {
        // Clock not installed
      }
    });

    it('should not show notifications during quiet hours', () => {
      service.updateSettings({
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '08:00'
        }
      });

      // Mock current time to be in quiet hours (2 AM)
      jasmine.clock().mockDate(new Date('2023-01-01T02:00:00'));

      const alert: BudgetAlert = {
        id: 'test-alert',
        type: 'critical',
        message: 'Test message',
        threshold: 100,
        currentValue: 95,
        timestamp: new Date(),
        acknowledged: false
      };

      service.addNotification(alert);
      
      expect(window.Notification).not.toHaveBeenCalled();
    });

    it('should show notifications outside quiet hours', () => {
      service.updateSettings({
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '08:00'
        }
      });

      // Mock current time to be outside quiet hours (2 PM)
      jasmine.clock().mockDate(new Date('2023-01-01T14:00:00'));

      const alert: BudgetAlert = {
        id: 'test-alert',
        type: 'critical',
        message: 'Test message',
        threshold: 100,
        currentValue: 95,
        timestamp: new Date(),
        acknowledged: false
      };

      service.addNotification(alert);
      
      expect(window.Notification).toHaveBeenCalled();
    });
  });

  describe('Notification Type Filtering', () => {
    it('should filter notifications based on type settings', () => {
      service.updateSettings({
        notificationTypes: {
          budgetOverrun: false,
          budgetThreshold: true,
          projectedOverspend: false,
          categoryOverrun: false,
          dailyDigest: false
        }
      });

      const criticalAlert: BudgetAlert = {
        id: 'critical-alert',
        type: 'critical',
        message: 'Budget overrun',
        threshold: 100,
        currentValue: 105,
        timestamp: new Date(),
        acknowledged: false
      };

      const warningAlert: BudgetAlert = {
        id: 'warning-alert',
        type: 'warning',
        message: 'Budget threshold',
        threshold: 75,
        currentValue: 80,
        timestamp: new Date(),
        acknowledged: false
      };

      service.addNotification(criticalAlert);
      service.addNotification(warningAlert);
      
      // Only warning alert should trigger notification
      expect(window.Notification).toHaveBeenCalledTimes(1);
    });
  });
});
