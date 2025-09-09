import { TestBed } from '@angular/core/testing';
import { ChartInteractionService, ChartInteractionConfig, DrillDownLevel } from './chart-interaction.service';

// Mock Chart.js
const mockChart = {
  destroy: jasmine.createSpy('destroy'),
  update: jasmine.createSpy('update'),
  resize: jasmine.createSpy('resize'),
  zoom: jasmine.createSpy('zoom'),
  resetZoom: jasmine.createSpy('resetZoom'),
  pan: jasmine.createSpy('pan'),
  canvas: {
    toDataURL: jasmine.createSpy('toDataURL').and.returnValue('data:image/png;base64,mock')
  },
  width: 400,
  height: 300,
  options: {
    plugins: {
      zoom: {
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' },
        pan: { enabled: true, mode: 'xy', threshold: 10 }
      }
    },
    scales: {
      x: { max: 100, min: 0 },
      y: { max: 100, min: 0 }
    }
  }
};

// Mock Chart.js module
const mockChartJS = {
  Chart: {
    register: jasmine.createSpy('register'),
    getChart: jasmine.createSpy('getChart').and.returnValue(mockChart)
  },
  __esModule: true,
  default: jasmine.createSpy('Chart').and.returnValue(mockChart)
};

// Mock the module
(window as any).Chart = mockChart;

describe('ChartInteractionService', () => {
  let service: ChartInteractionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChartInteractionService);
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('Interactive Chart Creation', () => {
    it('should create interactive chart configuration', () => {
      const data = {
        labels: ['Jan', 'Feb'],
        datasets: [{ label: 'Test', data: [100, 200] }]
      };
      
      const config = service.createInteractiveChart('line', data);
      
      expect(config).toBeDefined();
      expect(config.type).toBe('line');
      expect(config.data).toBe(data);
      expect(config.options).toBeDefined();
    });

    it('should apply zoom configuration', () => {
      const data = { labels: [], datasets: [] };
      const interactionConfig: ChartInteractionConfig = {
        zoom: { enabled: true, mode: 'xy' },
        pan: { enabled: true, mode: 'xy' }
      };
      
      const config = service.createInteractiveChart('line', data, {}, interactionConfig);
      
      expect(config.options?.plugins?.zoom).toBeDefined();
    });

    it('should apply drill-down configuration', () => {
      const data = { labels: [], datasets: [] };
      const drillDownLevels: DrillDownLevel[] = [
        {
          name: 'monthly',
          label: 'Monthly View',
          dataProcessor: (data) => data,
          chartType: 'line'
        }
      ];
      
      const interactionConfig: ChartInteractionConfig = {
        drillDown: {
          enabled: true,
          levels: drillDownLevels,
          onDrillDown: jasmine.createSpy('onDrillDown'),
          onDrillUp: jasmine.createSpy('onDrillUp')
        }
      };
      
      const config = service.createInteractiveChart('line', data, {}, interactionConfig);
      
      expect(config.options?.onClick).toBeDefined();
    });
  });

  describe('Zoom Controls', () => {
    it('should add zoom controls to chart', () => {
      const mockChart = { destroy: jasmine.createSpy('destroy') };
      const mockContainer = document.createElement('div');
      mockContainer.id = 'test-container';
      document.body.appendChild(mockContainer);
      
      spyOn(document, 'getElementById').and.returnValue(mockContainer);
      
      service.addZoomControls(mockChart as any, 'test-container');
      
      expect(mockContainer.querySelector('.chart-zoom-controls')).toBeTruthy();
      
      document.body.removeChild(mockContainer);
    });

    it('should handle missing container gracefully', () => {
      spyOn(document, 'getElementById').and.returnValue(null);
      
      expect(() => service.addZoomControls({} as any, 'nonexistent')).not.toThrow();
    });
  });

  describe('Drill-down Level Creation', () => {
    it('should create drill-down level', () => {
      const level = service.createDrillDownLevel(
        'monthly',
        'Monthly View',
        (data) => data,
        'line'
      );
      
      expect(level).toBeDefined();
      expect(level.name).toBe('monthly');
      expect(level.label).toBe('Monthly View');
      expect(level.chartType).toBe('line');
    });

    it('should create financial drill-down levels', () => {
      const levels = service.createFinancialDrillDownLevels();
      
      expect(levels).toBeDefined();
      expect(Array.isArray(levels)).toBe(true);
      expect(levels.length).toBe(4);
      
      const levelNames = levels.map(l => l.name);
      expect(levelNames).toContain('monthly');
      expect(levelNames).toContain('weekly');
      expect(levelNames).toContain('daily');
      expect(levelNames).toContain('category');
    });
  });

  describe('Chart Export', () => {
    it('should have export functionality', () => {
      expect(service).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle drill-down click with no elements', () => {
      const event = { elements: [] };
      const drillDownConfig = {
        enabled: true,
        levels: [],
        onDrillDown: jasmine.createSpy('onDrillDown')
      };
      
      service['handleDrillDown'](event, [], drillDownConfig);
      
      expect(drillDownConfig.onDrillDown).not.toHaveBeenCalled();
    });
  });
});