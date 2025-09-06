import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SkeletonLoaderComponent, SkeletonType } from './skeleton-loader';

describe('SkeletonLoaderComponent', () => {
  let component: SkeletonLoaderComponent;
  let fixture: ComponentFixture<SkeletonLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonLoaderComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonLoaderComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges() here to avoid ExpressionChangedAfterItHasBeenCheckedError
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('default values', () => {
    it('should have default type as text', () => {
      expect(component.type).toBe('text');
    });

    it('should have default width as 100%', () => {
      expect(component.width).toBe('100%');
    });

    it('should have default height as 1rem', () => {
      expect(component.height).toBe('1rem');
    });

    it('should have default borderRadius as 4px', () => {
      expect(component.borderRadius).toBe('4px');
    });
  });

  describe('type property', () => {
    it('should accept text type', () => {
      component.type = 'text';
      expect(component.type).toBe('text');
    });

    it('should accept title type', () => {
      component.type = 'title';
      expect(component.type).toBe('title');
    });

    it('should accept avatar type', () => {
      component.type = 'avatar';
      expect(component.type).toBe('avatar');
    });

    it('should accept button type', () => {
      component.type = 'button';
      expect(component.type).toBe('button');
    });

    it('should accept card type', () => {
      component.type = 'card';
      expect(component.type).toBe('card');
    });

    it('should accept list-item type', () => {
      component.type = 'list-item';
      expect(component.type).toBe('list-item');
    });

    it('should accept chart type', () => {
      component.type = 'chart';
      expect(component.type).toBe('chart');
    });

    it('should accept table-row type', () => {
      component.type = 'table-row';
      expect(component.type).toBe('table-row');
    });
  });

  describe('width property', () => {
    it('should accept custom width', () => {
      component.width = '200px';
      expect(component.width).toBe('200px');
    });

    it('should accept percentage width', () => {
      component.width = '50%';
      expect(component.width).toBe('50%');
    });

    it('should accept viewport width', () => {
      component.width = '50vw';
      expect(component.width).toBe('50vw');
    });

    it('should accept rem width', () => {
      component.width = '10rem';
      expect(component.width).toBe('10rem');
    });

    it('should accept em width', () => {
      component.width = '5em';
      expect(component.width).toBe('5em');
    });
  });

  describe('height property', () => {
    it('should accept custom height', () => {
      component.height = '50px';
      expect(component.height).toBe('50px');
    });

    it('should accept percentage height', () => {
      component.height = '100%';
      expect(component.height).toBe('100%');
    });

    it('should accept viewport height', () => {
      component.height = '50vh';
      expect(component.height).toBe('50vh');
    });

    it('should accept rem height', () => {
      component.height = '2rem';
      expect(component.height).toBe('2rem');
    });

    it('should accept em height', () => {
      component.height = '1.5em';
      expect(component.height).toBe('1.5em');
    });
  });

  describe('borderRadius property', () => {
    it('should accept custom borderRadius', () => {
      component.borderRadius = '8px';
      expect(component.borderRadius).toBe('8px');
    });

    it('should accept percentage borderRadius', () => {
      component.borderRadius = '50%';
      expect(component.borderRadius).toBe('50%');
    });

    it('should accept rem borderRadius', () => {
      component.borderRadius = '0.5rem';
      expect(component.borderRadius).toBe('0.5rem');
    });

    it('should accept em borderRadius', () => {
      component.borderRadius = '0.25em';
      expect(component.borderRadius).toBe('0.25em');
    });

    it('should accept zero borderRadius', () => {
      component.borderRadius = '0';
      expect(component.borderRadius).toBe('0');
    });
  });

  describe('template rendering', () => {
    it('should render skeleton loader div', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const skeletonDiv = compiled.querySelector('.skeleton-loader');
      expect(skeletonDiv).toBeTruthy();
    });

    it('should apply correct CSS class based on type', () => {
      component.type = 'title';
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const skeletonDiv = compiled.querySelector('.skeleton-loader');
      expect(skeletonDiv.classList.contains('skeleton-title')).toBe(true);
    });

    it('should apply width style', () => {
      component.width = '300px';
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const skeletonDiv = compiled.querySelector('.skeleton-loader');
      expect(skeletonDiv.style.width).toBe('300px');
    });

    it('should apply height style', () => {
      component.height = '50px';
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const skeletonDiv = compiled.querySelector('.skeleton-loader');
      expect(skeletonDiv.style.height).toBe('50px');
    });

    it('should apply borderRadius style', () => {
      component.borderRadius = '10px';
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const skeletonDiv = compiled.querySelector('.skeleton-loader');
      expect(skeletonDiv.style.borderRadius).toBe('10px');
    });

    it('should apply all styles together', () => {
      component.type = 'card';
      component.width = '250px';
      component.height = '150px';
      component.borderRadius = '12px';
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const skeletonDiv = compiled.querySelector('.skeleton-loader');
      
      expect(skeletonDiv.classList.contains('skeleton-card')).toBe(true);
      expect(skeletonDiv.style.width).toBe('250px');
      expect(skeletonDiv.style.height).toBe('150px');
      expect(skeletonDiv.style.borderRadius).toBe('12px');
    });
  });

  describe('SkeletonType enum', () => {
    it('should have all expected skeleton types', () => {
      const expectedTypes: SkeletonType[] = [
        'text', 'title', 'avatar', 'button', 
        'card', 'list-item', 'chart', 'table-row'
      ];
      
      expectedTypes.forEach(type => {
        component.type = type;
        expect(component.type).toBe(type);
      });
      
      // Test template rendering with the last type
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const skeletonDiv = compiled.querySelector('.skeleton-loader');
      expect(skeletonDiv.classList.contains('skeleton-table-row')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string width', () => {
      component.width = '';
      fixture.detectChanges();
      expect(component.width).toBe('');
    });

    it('should handle empty string height', () => {
      component.height = '';
      fixture.detectChanges();
      expect(component.height).toBe('');
    });

    it('should handle empty string borderRadius', () => {
      component.borderRadius = '';
      fixture.detectChanges();
      expect(component.borderRadius).toBe('');
    });

    it('should handle very large values', () => {
      component.width = '9999px';
      component.height = '9999px';
      component.borderRadius = '9999px';
      fixture.detectChanges();
      
      expect(component.width).toBe('9999px');
      expect(component.height).toBe('9999px');
      expect(component.borderRadius).toBe('9999px');
    });

    it('should handle negative values', () => {
      component.width = '-10px';
      component.height = '-10px';
      component.borderRadius = '-10px';
      fixture.detectChanges();
      
      expect(component.width).toBe('-10px');
      expect(component.height).toBe('-10px');
      expect(component.borderRadius).toBe('-10px');
    });
  });
});
