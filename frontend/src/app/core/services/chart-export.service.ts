import { Injectable } from '@angular/core';
import { Chart } from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportOptions {
  filename?: string;
  quality?: number;
  format?: 'png' | 'jpeg' | 'pdf' | 'svg' | 'csv';
  width?: number;
  height?: number;
  backgroundColor?: string;
  includeTitle?: boolean;
  includeLegend?: boolean;
  includeData?: boolean;
}

export interface PDFOptions {
  title?: string;
  subtitle?: string;
  author?: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'letter' | 'legal';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ChartExportService {

  constructor() { }

  // Export chart as image
  exportChartAsImage(chart: Chart, options: ExportOptions = {}): void {
    if (!chart) {
      console.warn('Chart is null or undefined, cannot export');
      return;
    }
    
    const defaultOptions: ExportOptions = {
      filename: `chart-${Date.now()}`,
      quality: 0.9,
      format: 'png',
      width: chart.width,
      height: chart.height,
      backgroundColor: '#ffffff',
      includeTitle: true,
      includeLegend: true,
      includeData: false
    };

    const config = { ...defaultOptions, ...options };
    const canvas = chart.canvas;
    const link = document.createElement('a');

    switch (config.format) {
      case 'png':
        link.download = `${config.filename}.png`;
        link.href = canvas.toDataURL('image/png', config.quality);
        break;
      case 'jpeg':
        link.download = `${config.filename}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', config.quality);
        break;
      case 'svg':
        this.exportChartAsSVG(chart, config);
        return;
      case 'pdf':
        this.exportChartAsPDF(chart, config);
        return;
      case 'csv':
        this.exportChartAsCSV(chart, config);
        return;
    }

    link.click();
  }

  // Export chart as SVG
  exportChartAsSVG(chart: Chart, options: ExportOptions): void {
    const canvas = chart.canvas;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    
    // Set SVG dimensions
    svg.setAttribute('width', (options.width || canvas.width).toString());
    svg.setAttribute('height', (options.height || canvas.height).toString());
    svg.setAttribute('viewBox', `0 0 ${canvas.width} ${canvas.height}`);
    
    // Add background if specified
    if (options.backgroundColor) {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', '100%');
      rect.setAttribute('height', '100%');
      rect.setAttribute('fill', options.backgroundColor);
      svg.appendChild(rect);
    }
    
    // Add chart image
    img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', canvas.toDataURL());
    img.setAttribute('width', canvas.width.toString());
    img.setAttribute('height', canvas.height.toString());
    svg.appendChild(img);
    
    // Add title if requested
    if (options.includeTitle && chart.options.plugins?.title?.display) {
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      title.setAttribute('x', '50%');
      title.setAttribute('y', '30');
      title.setAttribute('text-anchor', 'middle');
      title.setAttribute('font-family', 'Arial, sans-serif');
      title.setAttribute('font-size', '16');
      title.setAttribute('font-weight', 'bold');
      title.setAttribute('fill', '#333');
      title.textContent = (chart.options.plugins?.title?.text as string) || 'Chart';
      svg.insertBefore(title, img);
    }
    
    // Convert to string and download
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = `${options.filename}.svg`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  // Export chart as PDF
  exportChartAsPDF(chart: Chart, options: ExportOptions, pdfOptions: PDFOptions = {}): void {
    const defaultPdfOptions: PDFOptions = {
      title: 'Financial Chart',
      subtitle: 'Generated on ' + new Date().toLocaleDateString(),
      author: 'Personal Finance Tracker',
      orientation: 'landscape',
      pageSize: 'a4',
      margins: { top: 20, right: 20, bottom: 20, left: 20 }
    };

    const pdfConfig = { ...defaultPdfOptions, ...pdfOptions };
    const pdf = new jsPDF({
      orientation: pdfConfig.orientation,
      unit: 'mm',
      format: pdfConfig.pageSize
    });

    // Add title
    if (pdfConfig.title) {
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(pdfConfig.title, pdfConfig.margins!.left, pdfConfig.margins!.top);
    }

    // Add subtitle
    if (pdfConfig.subtitle) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(pdfConfig.subtitle, pdfConfig.margins!.left, pdfConfig.margins!.top + 10);
    }

    // Calculate chart dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const chartWidth = pageWidth - pdfConfig.margins!.left - pdfConfig.margins!.right;
    const chartHeight = pageHeight - pdfConfig.margins!.top - pdfConfig.margins!.bottom - 20;

    // Convert chart to image
    const canvas = chart.canvas;
    const imageData = canvas.toDataURL('image/png', options.quality || 0.9);

    // Add chart to PDF
    pdf.addImage(
      imageData,
      'PNG',
      pdfConfig.margins!.left,
      pdfConfig.margins!.top + 20,
      chartWidth,
      chartHeight
    );

    // Add footer
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      `Generated by ${pdfConfig.author} on ${new Date().toLocaleString()}`,
      pdfConfig.margins!.left,
      pageHeight - 10
    );

    // Download PDF
    pdf.save(`${options.filename || 'chart'}.pdf`);
  }

  // Export chart data as CSV
  exportChartAsCSV(chart: Chart, options: ExportOptions): void {
    const data = chart.data;
    const csvContent = this.convertChartDataToCSV(data);
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${options.filename || 'chart-data'}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  // Export multiple charts as combined PDF
  exportMultipleChartsAsPDF(
    charts: Chart[],
    options: ExportOptions = {},
    pdfOptions: PDFOptions = {}
  ): void {
    const defaultPdfOptions: PDFOptions = {
      title: 'Financial Dashboard Report',
      subtitle: 'Generated on ' + new Date().toLocaleDateString(),
      author: 'Personal Finance Tracker',
      orientation: 'portrait',
      pageSize: 'a4',
      margins: { top: 20, right: 20, bottom: 20, left: 20 }
    };

    const pdfConfig = { ...defaultPdfOptions, ...pdfOptions };
    const pdf = new jsPDF({
      orientation: pdfConfig.orientation,
      unit: 'mm',
      format: pdfConfig.pageSize
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const chartWidth = pageWidth - pdfConfig.margins!.left - pdfConfig.margins!.right;
    const chartHeight = (pageHeight - pdfConfig.margins!.top - pdfConfig.margins!.bottom - 40) / charts.length;

    // Add title
    if (pdfConfig.title) {
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(pdfConfig.title, pdfConfig.margins!.left, pdfConfig.margins!.top);
    }

    // Add subtitle
    if (pdfConfig.subtitle) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(pdfConfig.subtitle, pdfConfig.margins!.left, pdfConfig.margins!.top + 10);
    }

    // Add each chart
    charts.forEach((chart, index) => {
      if (index > 0) {
        pdf.addPage();
      }

      const canvas = chart.canvas;
      const imageData = canvas.toDataURL('image/png', options.quality || 0.9);

      // Add chart title
      const chartTitle = this.getChartTitle(chart);
      if (chartTitle) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(chartTitle, pdfConfig.margins!.left, pdfConfig.margins!.top + 20);
      }

      // Add chart image
      pdf.addImage(
        imageData,
        'PNG',
        pdfConfig.margins!.left,
        pdfConfig.margins!.top + 30,
        chartWidth,
        chartHeight - 10
      );
    });

    // Add footer
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      `Generated by ${pdfConfig.author} on ${new Date().toLocaleString()}`,
      pdfConfig.margins!.left,
      pageHeight - 10
    );

    // Download PDF
    pdf.save(`${options.filename || 'financial-dashboard'}.pdf`);
  }

  // Export chart with custom styling
  exportStyledChart(
    chart: Chart,
    options: ExportOptions = {},
    customStyles: any = {}
  ): void {
    // Apply custom styles temporarily
    const originalOptions = { ...chart.options };
    chart.options = { ...chart.options, ...customStyles };
    chart.update('none');

    // Export with custom styles
    this.exportChartAsImage(chart, options);

    // Restore original options
    chart.options = originalOptions;
    chart.update('none');
  }

  // Export chart as high-resolution image
  exportHighResChart(chart: Chart, options: ExportOptions = {}): void {
    const scale = 2; // 2x resolution
    const canvas = chart.canvas;
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;

    // Create high-resolution canvas
    const highResCanvas = document.createElement('canvas');
    const ctx = highResCanvas.getContext('2d');
    
    if (!ctx) return;

    highResCanvas.width = originalWidth * scale;
    highResCanvas.height = originalHeight * scale;

    // Scale the context
    ctx.scale(scale, scale);
    ctx.drawImage(canvas, 0, 0);

    // Export high-resolution image
    const link = document.createElement('a');
    link.download = `${options.filename || 'chart'}-high-res.png`;
    link.href = highResCanvas.toDataURL('image/png', options.quality || 0.9);
    link.click();
  }

  // Private helper methods
  private convertChartDataToCSV(data: any): string {
    if (!data || !data.labels || !data.datasets) {
      return 'No data available';
    }

    const headers = ['Label', ...data.datasets.map((dataset: any) => dataset.label)];
    const rows = data.labels.map((label: string, index: number) => {
      const values = data.datasets.map((dataset: any) => dataset.data[index] || 0);
      return [label, ...values].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  private getChartTitle(chart: Chart): string | null {
    return (chart.options.plugins?.title?.text as string) || null;
  }

  // Utility method to create export options
  createExportOptions(
    filename?: string,
    format: 'png' | 'jpeg' | 'pdf' | 'svg' | 'csv' = 'png',
    quality: number = 0.9
  ): ExportOptions {
    return {
      filename: filename || `chart-${Date.now()}`,
      format,
      quality,
      includeTitle: true,
      includeLegend: true,
      includeData: false
    };
  }

  // Utility method to create PDF options
  createPDFOptions(
    title?: string,
    orientation: 'portrait' | 'landscape' = 'landscape',
    pageSize: 'a4' | 'letter' | 'legal' = 'a4'
  ): PDFOptions {
    return {
      title: title || 'Financial Chart',
      subtitle: 'Generated on ' + new Date().toLocaleDateString(),
      author: 'Personal Finance Tracker',
      orientation,
      pageSize,
      margins: { top: 20, right: 20, bottom: 20, left: 20 }
    };
  }
}
