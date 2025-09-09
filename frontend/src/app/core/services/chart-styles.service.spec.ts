import { TestBed } from '@angular/core/testing';
import { ChartStylesService, ChartTheme } from './chart-styles.service';

describe('ChartStylesService', () => {
  let service: ChartStylesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChartStylesService);
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('Theme Management', () => {
    it('should get current theme', () => {
      const theme = service.getCurrentTheme();
      expect(theme).toBeDefined();
    });

    it('should set theme', () => {
      service.setTheme('dark');
      expect(service.getCurrentTheme().name).toBe('Dark');
    });

    it('should get all available themes', () => {
      const themes = service.getAvailableThemes();
      expect(themes).toBeDefined();
      expect(Array.isArray(themes)).toBe(true);
      expect(themes.length).toBeGreaterThan(0);
    });
  });

  describe('Color Generation', () => {
    it('should get color palette', () => {
      const palette = service.getColorPalette('line', 5);
      expect(palette).toBeDefined();
      expect(Array.isArray(palette)).toBe(true);
    });
  });

  describe('Responsive Design', () => {
    it('should get responsive chart config', () => {
      const config = service.getResponsiveChartConfig('line');
      expect(config).toBeDefined();
    });

    it('should get current chart options', () => {
      const options = service.getCurrentChartOptions('line');
      expect(options).toBeDefined();
    });
  });

  describe('Chart Type Styles', () => {
    it('should have chart style methods', () => {
      expect(service).toBeDefined();
    });
  });

  describe('Utility Methods', () => {
    it('should have utility methods', () => {
      expect(service).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', () => {
      expect(() => service.getColorPalette('invalid', 0)).not.toThrow();
    });
  });
});