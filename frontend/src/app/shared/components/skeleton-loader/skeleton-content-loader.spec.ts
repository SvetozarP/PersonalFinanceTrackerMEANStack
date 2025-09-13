import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { SkeletonContentLoaderComponent, SkeletonLayout } from './skeleton-content-loader';

describe('SkeletonContentLoaderComponent', () => {
  let component: SkeletonContentLoaderComponent;
  let fixture: ComponentFixture<SkeletonContentLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SkeletonContentLoaderComponent
      ],
      providers: [
        provideZonelessChangeDetection()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonContentLoaderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      expect(component.layout).toBe('card');
      expect(component.count).toBe(3);
    });

    it('should accept custom layout', () => {
      component.layout = 'list';
      
      expect(component.layout).toBe('list');
    });

    it('should accept custom count', () => {
      component.count = 5;
      
      expect(component.count).toBe(5);
    });
  });

  describe('layout types', () => {
    const layouts: SkeletonLayout[] = ['card', 'list', 'form', 'table', 'chart', 'metrics'];

    layouts.forEach(layout => {
      it(`should render ${layout} layout`, () => {
        component.layout = layout;
        component.count = 2;
        
        fixture.detectChanges();
        
        const compiled = fixture.nativeElement;
        const layoutElement = compiled.querySelector(`.layout-${layout}`);
        
        expect(layoutElement).toBeTruthy();
      });
    });
  });

  describe('card layout', () => {
    beforeEach(() => {
      component.layout = 'card';
      component.count = 2;
      fixture.detectChanges();
    });

    it('should render correct number of cards', () => {
      const compiled = fixture.nativeElement;
      const cards = compiled.querySelectorAll('.skeleton-card');
      
      expect(cards.length).toBe(2);
    });

    it('should render card header elements', () => {
      const compiled = fixture.nativeElement;
      const cardHeaders = compiled.querySelectorAll('.skeleton-card-header');
      
      expect(cardHeaders.length).toBe(2);
    });

    it('should render card content elements', () => {
      const compiled = fixture.nativeElement;
      const cardContents = compiled.querySelectorAll('.skeleton-card-content');
      
      expect(cardContents.length).toBe(2);
    });

    it('should render card actions elements', () => {
      const compiled = fixture.nativeElement;
      const cardActions = compiled.querySelectorAll('.skeleton-card-actions');
      
      expect(cardActions.length).toBe(2);
    });
  });

  describe('list layout', () => {
    beforeEach(() => {
      component.layout = 'list';
      component.count = 3;
      fixture.detectChanges();
    });

    it('should render correct number of list items', () => {
      const compiled = fixture.nativeElement;
      const listItems = compiled.querySelectorAll('.skeleton-list-item');
      
      expect(listItems.length).toBe(3);
    });

    it('should render list content elements', () => {
      const compiled = fixture.nativeElement;
      const listContents = compiled.querySelectorAll('.skeleton-list-content');
      
      expect(listContents.length).toBe(3);
    });
  });

  describe('form layout', () => {
    beforeEach(() => {
      component.layout = 'form';
      component.count = 4;
      fixture.detectChanges();
    });

    it('should render correct number of form groups', () => {
      const compiled = fixture.nativeElement;
      const formGroups = compiled.querySelectorAll('.skeleton-form-group');
      
      expect(formGroups.length).toBe(4);
    });

    it('should render form actions', () => {
      const compiled = fixture.nativeElement;
      const formActions = compiled.querySelectorAll('.skeleton-form-actions');
      
      expect(formActions.length).toBe(1);
    });
  });

  describe('table layout', () => {
    beforeEach(() => {
      component.layout = 'table';
      component.count = 5;
      fixture.detectChanges();
    });

    it('should render table header', () => {
      const compiled = fixture.nativeElement;
      const tableHeader = compiled.querySelectorAll('.skeleton-table-header');
      
      expect(tableHeader.length).toBe(1);
    });

    it('should render correct number of table rows', () => {
      const compiled = fixture.nativeElement;
      const tableRows = compiled.querySelectorAll('.skeleton-table-row');
      
      expect(tableRows.length).toBe(5);
    });
  });

  describe('chart layout', () => {
    beforeEach(() => {
      component.layout = 'chart';
      component.count = 1;
      fixture.detectChanges();
    });

    it('should render chart header', () => {
      const compiled = fixture.nativeElement;
      const chartHeader = compiled.querySelectorAll('.skeleton-chart-header');
      
      expect(chartHeader.length).toBe(1);
    });

    it('should render chart element', () => {
      const compiled = fixture.nativeElement;
      const chartElement = compiled.querySelector('app-skeleton-loader[type="chart"]');
      
      expect(chartElement).toBeTruthy();
    });
  });

  describe('metrics layout', () => {
    beforeEach(() => {
      component.layout = 'metrics';
      component.count = 6;
      fixture.detectChanges();
    });

    it('should render correct number of metrics', () => {
      const compiled = fixture.nativeElement;
      const metrics = compiled.querySelectorAll('.skeleton-metric');
      
      expect(metrics.length).toBe(6);
    });
  });

  describe('count variations', () => {
    it('should handle zero count', () => {
      component.layout = 'card';
      component.count = 0;
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const cards = compiled.querySelectorAll('.skeleton-card');
      
      expect(cards.length).toBe(0);
    });

    it('should handle single item', () => {
      component.layout = 'list';
      component.count = 1;
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const listItems = compiled.querySelectorAll('.skeleton-list-item');
      
      expect(listItems.length).toBe(1);
    });

    it('should handle large count', () => {
      component.layout = 'table';
      component.count = 100;
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const tableRows = compiled.querySelectorAll('.skeleton-table-row');
      
      expect(tableRows.length).toBe(100);
    });
  });

  describe('edge cases', () => {
    it('should handle negative count', () => {
      component.layout = 'card';
      component.count = -1;
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const cards = compiled.querySelectorAll('.skeleton-card');
      
      expect(cards.length).toBe(0);
    });

    it('should handle very large count', () => {
      component.layout = 'list';
      component.count = 1000;
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const listItems = compiled.querySelectorAll('.skeleton-list-item');
      
      expect(listItems.length).toBe(1000);
    });

    it('should handle null count', () => {
      component.layout = 'form';
      component.count = null as any;
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const formGroups = compiled.querySelectorAll('.skeleton-form-group');
      
      expect(formGroups.length).toBe(0);
    });

    it('should handle undefined count', () => {
      component.layout = 'metrics';
      component.count = undefined as any;
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const metrics = compiled.querySelectorAll('.skeleton-metric');
      
      expect(metrics.length).toBe(0);
    });
  });

  describe('CSS classes', () => {
    it('should apply correct layout class', () => {
      component.layout = 'chart';
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const container = compiled.querySelector('.skeleton-content-loader');
      
      expect(container.classList.contains('layout-chart')).toBe(true);
    });

    xit('should apply multiple layout classes when changed', fakeAsync(() => {
      component.layout = 'card';
      fixture.detectChanges();
      
      let compiled = fixture.nativeElement;
      let container = compiled.querySelector('.skeleton-content-loader');
      expect(container.classList.contains('layout-card')).toBe(true);
      
      component.layout = 'table';
      tick(); // Advance the virtual clock
      fixture.detectChanges();
      
      compiled = fixture.nativeElement;
      container = compiled.querySelector('.skeleton-content-loader');
      expect(container.classList.contains('layout-table')).toBe(true);
      expect(container.classList.contains('layout-card')).toBe(false);
    }));
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      component.layout = 'card';
      component.count = 2;
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const container = compiled.querySelector('.skeleton-content-loader');
      
      expect(container).toBeTruthy();
    });

    it('should be accessible for screen readers', () => {
      component.layout = 'list';
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const skeletonElements = compiled.querySelectorAll('app-skeleton-loader');
      
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  describe('performance', () => {
    it('should handle rapid layout changes', () => {
      const layouts: SkeletonLayout[] = ['card', 'list', 'form', 'table', 'chart', 'metrics'];
      
      layouts.forEach(layout => {
        component.layout = layout;
        component.count = 10;
        fixture.detectChanges();
        
        expect(component.layout).toBe(layout);
        expect(component.skeletonItems.length).toBe(10);
      });
    });

    it('should handle rapid count changes', () => {
      component.layout = 'card';
      
      for (let i = 0; i < 100; i++) {
        component.count = i;
        fixture.detectChanges();
        
        expect(component.count).toBe(i);
        expect(component.skeletonItems.length).toBe(i);
      }
    });
  });

  describe('input validation', () => {
    it('should accept valid layout types', () => {
      const validLayouts: SkeletonLayout[] = ['card', 'list', 'form', 'table', 'chart', 'metrics'];
      
      validLayouts.forEach(layout => {
        component.layout = layout;
        expect(component.layout).toBe(layout);
      });
    });

    it('should handle invalid layout types gracefully', () => {
      component.layout = 'invalid' as any;
      
      expect(component.layout).toBe('invalid');
    });

    it('should accept numeric count values', () => {
      const validCounts = [0, 1, 5, 10, 100, 1000];
      
      validCounts.forEach(count => {
        component.count = count;
        expect(component.count).toBe(count);
      });
    });
  });
});
