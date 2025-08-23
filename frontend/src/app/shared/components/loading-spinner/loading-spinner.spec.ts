import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadingSpinnerComponent } from './loading-spinner';

describe('LoadingSpinnerComponent', () => {
  let component: LoadingSpinnerComponent;
  let fixture: ComponentFixture<LoadingSpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSpinnerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoadingSpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.message).toBe('');
    expect(component.size).toBe('medium');
    expect(component.overlay).toBe(false);
  });

  it('should apply overlay class when overlay is true', () => {
    component.overlay = true;
    fixture.detectChanges();
    
    const spinnerElement = fixture.nativeElement.querySelector('.loading-spinner');
    expect(spinnerElement.classList.contains('overlay')).toBe(true);
  });

  it('should apply size classes correctly', () => {
    // Test small size
    component.size = 'small';
    fixture.detectChanges();
    let spinnerElement = fixture.nativeElement.querySelector('.loading-spinner');
    expect(spinnerElement.classList.contains('small')).toBe(true);
    expect(spinnerElement.classList.contains('large')).toBe(false);

    // Test large size
    component.size = 'large';
    fixture.detectChanges();
    spinnerElement = fixture.nativeElement.querySelector('.loading-spinner');
    expect(spinnerElement.classList.contains('large')).toBe(true);
    expect(spinnerElement.classList.contains('small')).toBe(false);
  });

  it('should display message when provided', () => {
    component.message = 'Loading data...';
    fixture.detectChanges();
    
    const messageElement = fixture.nativeElement.querySelector('.loading-message');
    expect(messageElement).toBeTruthy();
    expect(messageElement.textContent).toContain('Loading data...');
  });

  it('should not display message when empty', () => {
    component.message = '';
    fixture.detectChanges();
    
    const messageElement = fixture.nativeElement.querySelector('.loading-message');
    expect(messageElement).toBeFalsy();
  });

  it('should have spinner elements', () => {
    const spinnerElement = fixture.nativeElement.querySelector('.spinner');
    expect(spinnerElement).toBeTruthy();
    
    const bounceElements = fixture.nativeElement.querySelectorAll('.bounce1, .bounce2, .bounce3');
    expect(bounceElements.length).toBe(3);
  });
});
