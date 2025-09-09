import { TestBed } from '@angular/core/testing';
import { SharedChartService } from './chart.service';
import { ChartModule } from './chart.module';
import { ChartConfiguration, ChartType } from 'chart.js';

describe('SharedChartService', () => {
  let service: SharedChartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SharedChartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getChart', () => {
    it('should return Chart constructor', () => {
      const chart = service.getChart();
      expect(chart).toBeDefined();
      expect(typeof chart).toBe('function');
    });

    it('should return the same Chart instance', () => {
      const chart1 = service.getChart();
      const chart2 = service.getChart();
      expect(chart1).toBe(chart2);
    });
  });

  describe('createChart', () => {
    let mockCanvas: HTMLCanvasElement;
    let mockConfig: ChartConfiguration;

    beforeEach(() => {
      mockCanvas = document.createElement('canvas');
      mockConfig = {
        type: 'line' as ChartType,
        data: {
          labels: ['January', 'February', 'March'],
          datasets: [{
            label: 'Test Dataset',
            data: [10, 20, 30]
          }]
        },
        options: {}
      };
    });

    it('should create a chart with valid canvas and config', () => {
      const chart = service.createChart(mockCanvas, mockConfig);
      expect(chart).toBeDefined();
      expect(chart).toBeInstanceOf(service.getChart());
    });

    it('should handle different chart types', () => {
      const barConfig = { ...mockConfig, type: 'bar' as ChartType };
      const pieConfig = { ...mockConfig, type: 'pie' as ChartType };
      const doughnutConfig = { ...mockConfig, type: 'doughnut' as ChartType };

      // Create separate canvases for each chart type to avoid canvas reuse issues
      const barCanvas = document.createElement('canvas');
      const pieCanvas = document.createElement('canvas');
      const doughnutCanvas = document.createElement('canvas');

      expect(() => service.createChart(barCanvas, barConfig)).not.toThrow();
      expect(() => service.createChart(pieCanvas, pieConfig)).not.toThrow();
      expect(() => service.createChart(doughnutCanvas, doughnutConfig)).not.toThrow();
    });

    it('should handle empty datasets', () => {
      const emptyConfig = {
        ...mockConfig,
        data: {
          labels: [],
          datasets: []
        }
      };

      expect(() => service.createChart(mockCanvas, emptyConfig)).not.toThrow();
    });

    it('should handle config without options', () => {
      const configWithoutOptions: ChartConfiguration = {
        type: 'line' as ChartType,
        data: mockConfig.data
      };

      expect(() => service.createChart(mockCanvas, configWithoutOptions)).not.toThrow();
    });
  });

  describe('integration with ChartModule', () => {
    it('should use Chart from ChartModule', () => {
      const chartFromService = service.getChart();
      const chartFromModule = ChartModule.getChart();
      expect(chartFromService).toBe(chartFromModule);
    });
  });

  describe('error handling', () => {
    it('should handle null canvas gracefully', () => {
      const config: ChartConfiguration = {
        type: 'line' as ChartType,
        data: { labels: [], datasets: [] }
      };

      // The service doesn't throw errors, it just logs them
      expect(() => service.createChart(null as any, config)).not.toThrow();
    });

    it('should handle null config gracefully', () => {
      const canvas = document.createElement('canvas');
      // The service doesn't throw errors, it just logs them
      expect(() => service.createChart(canvas, null as any)).not.toThrow();
    });

    it('should handle invalid config type gracefully', () => {
      const canvas = document.createElement('canvas');
      const invalidConfig = {
        type: 'invalid-type' as any,
        data: { labels: [], datasets: [] }
      };

      // The service doesn't throw errors, it just logs them
      expect(() => service.createChart(canvas, invalidConfig)).not.toThrow();
    });
  });
});
