import { Injectable } from '@angular/core';
import { Chart, ChartConfiguration } from 'chart.js';
import { ChartModule } from './chart.module';

@Injectable({
  providedIn: 'root'
})
export class SharedChartService {
  private chart: typeof Chart;

  constructor() {
    this.chart = ChartModule.getChart();
  }

  getChart(): typeof Chart {
    return this.chart;
  }

  createChart(canvas: HTMLCanvasElement, config: ChartConfiguration): Chart {
    return new this.chart(canvas, config);
  }
}
