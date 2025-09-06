import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RealtimeBudgetProgressComponent } from './realtime-budget-progress.component';
import { RealtimeBudgetProgressService } from '../../../../core/services/realtime-budget-progress.service';
import { BudgetNotificationService } from '../../../../core/services/budget-notification.service';

describe('RealtimeBudgetProgressComponent', () => {
  let component: RealtimeBudgetProgressComponent;
  let fixture: ComponentFixture<RealtimeBudgetProgressComponent>;
  let mockRealtimeService: jasmine.SpyObj<RealtimeBudgetProgressService>;
  let mockNotificationService: jasmine.SpyObj<BudgetNotificationService>;

  const mockBudgetProgress = [
    {
      budgetId: '1',
      budgetName: 'Test Budget',
      totalAmount: 1000,
      spentAmount: 500,
      remainingAmount: 500,
      progressPercentage: 50,
      status: 'under' as const,
      daysRemaining: 15,
      categoryProgress: [
        {
          categoryId: 'cat1',
          categoryName: 'Food',
          allocatedAmount: 400,
          spentAmount: 200,
          remainingAmount: 200,
          progressPercentage: 50,
          status: 'under' as const,
          trend: 'stable' as const,
          dailyAverage: 13.33,
          projectedOverspend: false
        }
      ],
      lastUpdated: new Date(),
      alerts: []
    }
  ];

  const mockBudgetStats = {
    totalBudgets: 1,
    activeBudgets: 1,
    onTrackBudgets: 1,
    overBudgetBudgets: 0,
    criticalBudgets: 0,
    totalSpent: 500,
    totalBudget: 1000,
    overallProgress: 50,
    averageProgress: 50,
    lastUpdated: new Date()
  };

  const mockAlerts = [
    {
      id: 'alert1',
      type: 'warning' as const,
      message: 'Test alert',
      timestamp: new Date(),
      acknowledged: false
    }
  ];

  beforeEach(async () => {
    const realtimeServiceSpy = jasmine.createSpyObj('RealtimeBudgetProgressService', [
      'getRealtimeProgress',
      'getBudgetStats',
      'getAlerts',
      'getConnectionStatus',
      'refreshData',
      'acknowledgeAlert'
    ]);

    const notificationServiceSpy = jasmine.createSpyObj('BudgetNotificationService', [
      'getNotifications',
      'markAsRead'
    ]);

    await TestBed.configureTestingModule({
      imports: [RealtimeBudgetProgressComponent],
      providers: [
        { provide: RealtimeBudgetProgressService, useValue: realtimeServiceSpy },
        { provide: BudgetNotificationService, useValue: notificationServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RealtimeBudgetProgressComponent);
    component = fixture.componentInstance;
    mockRealtimeService = TestBed.inject(RealtimeBudgetProgressService) as jasmine.SpyObj<RealtimeBudgetProgressService>;
    mockNotificationService = TestBed.inject(BudgetNotificationService) as jasmine.SpyObj<BudgetNotificationService>;

    // Setup mock return values
    mockRealtimeService.getRealtimeProgress.and.returnValue(of(mockBudgetProgress));
    mockRealtimeService.getBudgetStats.and.returnValue(of(mockBudgetStats));
    mockRealtimeService.getAlerts.and.returnValue(of(mockAlerts));
    mockRealtimeService.getConnectionStatus.and.returnValue(of(true));
    mockNotificationService.getNotifications.and.returnValue(of([]));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.budgetId).toBeUndefined();
    expect(component.showAlerts).toBe(true);
    expect(component.showStats).toBe(true);
    expect(component.compact).toBe(false);
    expect(component.autoRefresh).toBe(true);
  });

  it('should load data on initialization', () => {
    component.ngOnInit();
    expect(mockRealtimeService.getRealtimeProgress).toHaveBeenCalled();
    expect(mockRealtimeService.getBudgetStats).toHaveBeenCalled();
    expect(mockRealtimeService.getAlerts).toHaveBeenCalled();
    expect(mockRealtimeService.getConnectionStatus).toHaveBeenCalled();
  });

  it('should filter budget progress by budgetId when provided', () => {
    component.budgetId = '1';
    component.ngOnInit();
    expect(component.budgetProgress).toEqual(mockBudgetProgress);
  });

  it('should show all budget progress when budgetId is not provided', () => {
    component.budgetId = undefined;
    component.ngOnInit();
    expect(component.budgetProgress).toEqual(mockBudgetProgress);
  });

  it('should handle budget click events', () => {
    spyOn(component.budgetClick, 'emit');
    const budget = mockBudgetProgress[0];
    
    component.onBudgetClick(budget);
    
    expect(component.budgetClick.emit).toHaveBeenCalledWith(budget);
  });

  it('should handle category click events', () => {
    spyOn(component.categoryClick, 'emit');
    const budget = mockBudgetProgress[0];
    const category = budget.categoryProgress[0];
    
    component.onCategoryClick(budget, category);
    
    expect(component.categoryClick.emit).toHaveBeenCalledWith({ budget, category });
  });

  it('should handle alert click events', () => {
    spyOn(component.alertClick, 'emit');
    const alert = mockAlerts[0];
    
    component.onAlertClick(alert);
    
    expect(component.alertClick.emit).toHaveBeenCalledWith(alert);
  });

  it('should acknowledge alerts', () => {
    const alertId = 'alert1';
    
    component.onAcknowledgeAlert(alertId);
    
    expect(mockRealtimeService.acknowledgeAlert).toHaveBeenCalledWith(alertId);
    expect(mockNotificationService.markAsRead).toHaveBeenCalledWith(alertId);
  });

  it('should refresh data', () => {
    component.onRefresh();
    expect(mockRealtimeService.refreshData).toHaveBeenCalled();
  });

  it('should get progress value for budget', () => {
    component.progressAnimations.set('1', 75);
    const value = component.getProgressValue('1');
    expect(value).toBe(75);
  });

  it('should get progress value for category', () => {
    component.progressAnimations.set('1-cat1', 50);
    const value = component.getCategoryProgressValue('1', 'cat1');
    expect(value).toBe(50);
  });

  it('should return correct status class', () => {
    expect(component.getStatusClass('under')).toBe('status-under');
    expect(component.getStatusClass('at')).toBe('status-at');
    expect(component.getStatusClass('over')).toBe('status-over');
    expect(component.getStatusClass('critical')).toBe('status-critical');
  });

  it('should return correct status icon', () => {
    expect(component.getStatusIcon('under')).toBe('fas fa-check-circle');
    expect(component.getStatusIcon('at')).toBe('fas fa-exclamation-triangle');
    expect(component.getStatusIcon('over')).toBe('fas fa-times-circle');
    expect(component.getStatusIcon('critical')).toBe('fas fa-exclamation-circle');
  });

  it('should return correct progress bar class', () => {
    const class1 = component.getProgressBarClass(50, 'under');
    expect(class1).toContain('progress-fill');
    expect(class1).toContain('status-under');
    expect(class1).toContain('animated');

    const class2 = component.getProgressBarClass(0, 'under');
    expect(class2).toContain('progress-fill');
    expect(class2).toContain('status-under');
    expect(class2).not.toContain('animated');
  });

  it('should return correct alert class', () => {
    const alert = { id: 'test', acknowledged: false, type: 'warning' } as any;
    component.alertAnimations.set('test', true);
    
    const alertClass = component.getAlertClass(alert);
    expect(alertClass).toContain('alert-item');
    expect(alertClass).toContain('alert-warning');
    expect(alertClass).toContain('pulse');
    expect(alertClass).not.toContain('acknowledged');
  });

  it('should return correct trend icon', () => {
    expect(component.getTrendIcon('increasing')).toBe('fas fa-arrow-up');
    expect(component.getTrendIcon('decreasing')).toBe('fas fa-arrow-down');
    expect(component.getTrendIcon('stable')).toBe('fas fa-minus');
  });

  it('should return correct trend class', () => {
    expect(component.getTrendClass('increasing')).toBe('trend-increasing');
    expect(component.getTrendClass('decreasing')).toBe('trend-decreasing');
    expect(component.getTrendClass('stable')).toBe('trend-stable');
  });

  it('should format currency correctly', () => {
    expect(component.formatCurrency(1234.56)).toBe('$1,234.56');
    expect(component.formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
  });

  it('should format percentage correctly', () => {
    expect(component.formatPercentage(50.123)).toBe('50.1%');
    expect(component.formatPercentage(75.678)).toBe('75.7%');
  });

  it('should format time ago correctly', () => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const oneDayAgo = new Date(now.getTime() - 86400000);

    expect(component.getTimeAgo(now)).toBe('Just now');
    expect(component.getTimeAgo(oneMinuteAgo)).toBe('1m ago');
    expect(component.getTimeAgo(oneHourAgo)).toBe('1h ago');
    expect(component.getTimeAgo(oneDayAgo)).toBe('1d ago');
  });

  it('should filter unacknowledged alerts', () => {
    const alerts = [
      { id: '1', acknowledged: false } as any,
      { id: '2', acknowledged: true } as any,
      { id: '3', acknowledged: false } as any
    ];
    component.alerts = alerts;

    const unacknowledged = component.getUnacknowledgedAlerts();
    expect(unacknowledged.length).toBe(2);
    expect(unacknowledged[0].id).toBe('1');
    expect(unacknowledged[1].id).toBe('3');
  });

  it('should filter critical alerts', () => {
    const alerts = [
      { id: '1', type: 'critical', acknowledged: false } as any,
      { id: '2', type: 'warning', acknowledged: false } as any,
      { id: '3', type: 'critical', acknowledged: true } as any
    ];
    component.alerts = alerts;

    const critical = component.getCriticalAlerts();
    expect(critical.length).toBe(1);
    expect(critical[0].id).toBe('1');
  });

  it('should filter warning alerts', () => {
    const alerts = [
      { id: '1', type: 'critical', acknowledged: false } as any,
      { id: '2', type: 'warning', acknowledged: false } as any,
      { id: '3', type: 'warning', acknowledged: true } as any
    ];
    component.alerts = alerts;

    const warnings = component.getWarningAlerts();
    expect(warnings.length).toBe(1);
    expect(warnings[0].id).toBe('2');
  });

  it('should count budgets by status', () => {
    component.budgetProgress = [
      { status: 'under' } as any,
      { status: 'under' } as any,
      { status: 'at' } as any,
      { status: 'over' } as any,
      { status: 'critical' } as any
    ];

    expect(component.getOnTrackCount()).toBe(2);
    expect(component.getAtThresholdCount()).toBe(1);
    expect(component.getOverBudgetCount()).toBe(1);
    expect(component.getCriticalCount()).toBe(1);
  });

  it('should update progress bars', () => {
    component.budgetProgress = mockBudgetProgress;
    
    component['animateProgressBars']();
    
    // Verify that progress animations are set
    expect(component['progressAnimations'].size).toBeGreaterThan(0);
  });

  it('should update alert animations', () => {
    component.alerts = mockAlerts;
    
    component['animateAlerts']();
    
    // Verify that alert animations are set
    expect(component['alertAnimations'].size).toBeGreaterThan(0);
  });

  it('should handle component destruction', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});
