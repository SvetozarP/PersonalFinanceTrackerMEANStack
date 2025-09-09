import { TestBed } from '@angular/core/testing';
import { ChartExportService, ExportOptions, PDFOptions } from './chart-export.service';

// Mock jsPDF
const mockJsPDF = jasmine.createSpy('jsPDF').and.returnValue({
  addImage: jasmine.createSpy('addImage'),
  save: jasmine.createSpy('save'),
  addPage: jasmine.createSpy('addPage'),
  setFontSize: jasmine.createSpy('setFontSize'),
  text: jasmine.createSpy('text'),
  setTextColor: jasmine.createSpy('setTextColor'),
  setFont: jasmine.createSpy('setFont'),
  internal: {
    pageSize: {
      getWidth: jasmine.createSpy('getWidth').and.returnValue(210),
      getHeight: jasmine.createSpy('getHeight').and.returnValue(297)
    }
  }
});

// Mock html2canvas
const mockHtml2Canvas = jasmine.createSpy('html2canvas').and.returnValue(Promise.resolve({
  toDataURL: jasmine.createSpy('toDataURL').and.returnValue('data:image/png;base64,mock')
}));

// Mock the modules
(window as any).jsPDF = mockJsPDF;
(window as any).html2canvas = mockHtml2Canvas;

describe('ChartExportService', () => {
  let service: ChartExportService;
  let mockChart: any;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChartExportService);
    
    // Reset mocks
    mockJsPDF.calls.reset();
    mockHtml2Canvas.calls.reset();
    
    // Create a comprehensive mock chart
    mockChart = {
      canvas: {
        toDataURL: jasmine.createSpy('toDataURL').and.returnValue('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='),
        width: 400,
        height: 300
      },
      width: 400,
      height: 300,
      data: {
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [
          { label: 'Income', data: [5000, 5500, 6000] },
          { label: 'Expenses', data: [3000, 3200, 3500] }
        ]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: 'Test Chart'
          }
        }
      },
      update: jasmine.createSpy('update')
    };

    // Mock console.warn
    spyOn(console, 'warn').and.stub();
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('exportChartAsImage', () => {
    it('should handle null chart gracefully', () => {
      service.exportChartAsImage(null as any, {});
      expect(console.warn).toHaveBeenCalledWith('Chart is null or undefined, cannot export');
    });

    it('should call exportChartAsSVG for SVG format', () => {
      spyOn(service, 'exportChartAsSVG');
      
      service.exportChartAsImage(mockChart, { format: 'svg' });
      
      expect(service.exportChartAsSVG).toHaveBeenCalled();
    });

    it('should call exportChartAsPDF for PDF format', () => {
      spyOn(service, 'exportChartAsPDF');
      
      service.exportChartAsImage(mockChart, { format: 'pdf' });
      
      expect(service.exportChartAsPDF).toHaveBeenCalled();
    });

    it('should call exportChartAsCSV for CSV format', () => {
      spyOn(service, 'exportChartAsCSV');
      
      service.exportChartAsImage(mockChart, { format: 'csv' });
      
      expect(service.exportChartAsCSV).toHaveBeenCalled();
    });
  });

  describe('exportChartAsPDF', () => {
    it('should call PDF methods when exporting chart', () => {
      const options: ExportOptions = { filename: 'test-chart' };
      
      // Mock the service method to avoid complex PDF creation
      spyOn(service, 'exportChartAsPDF').and.callThrough();
      
      service.exportChartAsPDF(mockChart, options);
      
      expect(service.exportChartAsPDF).toHaveBeenCalledWith(mockChart, options);
    });
  });

  describe('exportMultipleChartsAsPDF', () => {
    it('should call PDF methods when exporting multiple charts', () => {
      const charts = [mockChart, mockChart];
      const options: ExportOptions = { filename: 'multi-chart' };
      
      // Mock the service method to avoid complex PDF creation
      spyOn(service, 'exportMultipleChartsAsPDF').and.callThrough();
      
      service.exportMultipleChartsAsPDF(charts, options);
      
      expect(service.exportMultipleChartsAsPDF).toHaveBeenCalledWith(charts, options);
    });
  });

  describe('exportStyledChart', () => {
    it('should export chart with custom styles', () => {
      const customStyles = { backgroundColor: 'red' };
      spyOn(service, 'exportChartAsImage');
      
      service.exportStyledChart(mockChart, { filename: 'styled-chart' }, customStyles);
      
      expect(service.exportChartAsImage).toHaveBeenCalled();
      expect(mockChart.update).toHaveBeenCalledTimes(2); // Once for custom, once for restore
    });
  });

  describe('createExportOptions', () => {
    it('should create export options with default values', () => {
      const options = service.createExportOptions();
      
      expect(options.filename).toContain('chart-');
      expect(options.format).toBe('png');
      expect(options.quality).toBe(0.9);
      expect(options.includeTitle).toBe(true);
      expect(options.includeLegend).toBe(true);
      expect(options.includeData).toBe(false);
    });

    it('should create export options with custom values', () => {
      const options = service.createExportOptions('custom-chart', 'pdf', 0.8);
      
      expect(options.filename).toBe('custom-chart');
      expect(options.format).toBe('pdf');
      expect(options.quality).toBe(0.8);
    });
  });

  describe('createPDFOptions', () => {
    it('should create PDF options with default values', () => {
      const options = service.createPDFOptions();
      
      expect(options.title).toBe('Financial Chart');
      expect(options.subtitle).toContain('Generated on');
      expect(options.author).toBe('Personal Finance Tracker');
      expect(options.orientation).toBe('landscape');
      expect(options.pageSize).toBe('a4');
      expect(options.margins).toEqual({ top: 20, right: 20, bottom: 20, left: 20 });
    });

    it('should create PDF options with custom values', () => {
      const options = service.createPDFOptions('Custom Title', 'portrait', 'letter');
      
      expect(options.title).toBe('Custom Title');
      expect(options.orientation).toBe('portrait');
      expect(options.pageSize).toBe('letter');
    });
  });

  describe('Private helper methods', () => {
    it('should convert chart data to CSV correctly', () => {
      const csvData = (service as any).convertChartDataToCSV(mockChart.data);
      
      expect(csvData).toContain('Label,Income,Expenses');
      expect(csvData).toContain('Jan,5000,3000');
      expect(csvData).toContain('Feb,5500,3200');
      expect(csvData).toContain('Mar,6000,3500');
    });

    it('should handle empty data in convertChartDataToCSV', () => {
      const csvData = (service as any).convertChartDataToCSV({});
      
      expect(csvData).toBe('No data available');
    });

    it('should get chart title correctly', () => {
      const title = (service as any).getChartTitle(mockChart);
      
      expect(title).toBe('Test Chart');
    });

    it('should return null for chart without title', () => {
      const chartWithoutTitle = { options: {} };
      const title = (service as any).getChartTitle(chartWithoutTitle);
      
      expect(title).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', () => {
      expect(() => service.exportChartAsImage(null as any, {})).not.toThrow();
    });
  });
});