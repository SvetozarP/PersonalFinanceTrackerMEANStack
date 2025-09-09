import { NgModule } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';

// Register Chart.js components once
Chart.register(...registerables);

@NgModule({
  providers: []
})
export class ChartModule {
  static getChart(): typeof Chart {
    return Chart;
  }
}
