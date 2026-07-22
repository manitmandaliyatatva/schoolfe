import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexTooltip,
  ApexPlotOptions,
  ApexLegend,
  ApexStroke,
  ApexDataLabels,
  NgApexchartsModule
} from 'ng-apexcharts';

export type StackedBarChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  tooltip: ApexTooltip;
  plotOptions: ApexPlotOptions;
  legend: ApexLegend;
  colors: string[];
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
};

export interface IDashboardStackedBarChartConfig {
  title?: string;
  data: { label: string, value: number }[];
  colors?: string[];
  height?: number;
}

@Component({
  selector: 'app-dashboard-stacked-bar-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="chart-wrapper">
      <div class="chart-header" *ngIf="config().title">
        <span class="chart-title">{{ config().title }}</span>
      </div>
      
      <div class="chart-content">
        <div class="chart-container">
          <apx-chart
            [series]="chartOptions().series"
            [chart]="chartOptions().chart"
            [xaxis]="chartOptions().xaxis"
            [yaxis]="chartOptions().yaxis"
            [plotOptions]="chartOptions().plotOptions"
            [legend]="chartOptions().legend"
            [colors]="chartOptions().colors"
            [stroke]="chartOptions().stroke"
            [dataLabels]="chartOptions().dataLabels"
            [tooltip]="chartOptions().tooltip"
          ></apx-chart>
        </div>

        <!-- Custom Legend -->
        <div class="custom-legend">
          <div class="legend-list">
            <div class="legend-item" *ngFor="let item of legendData(); let i = index">
              <div class="legend-indicator" [style.background-color]="(config().colors || ['#10b981', '#ef4444', '#6366f1', '#f59e0b', '#94a3b8'])[i]"></div>
              <div class="legend-label">{{ item.label }} ({{ item.value }})</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chart-wrapper {
      width: 100%;
    }
    .chart-header {
      margin-bottom: 12px;
    }
    .chart-title {
      font-size: 13px;
      font-weight: 500;
      color: #334155;
    }
    .chart-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .chart-container {
      width: 100%;
    }
    .custom-legend {
      width: 100%;
      margin-top: 4px;
    }
    .legend-list {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 20px;
      align-items: center;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .legend-indicator {
      width: 12px;
      height: 12px;
      border-radius: 3px;
    }
    .legend-label {
      font-size: 13px;
      font-weight: 500;
      color: #475569;
    }
    :host ::ng-deep .apexcharts-canvas {
      margin: 0 auto;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardStackedBarChart {
  config = input.required<IDashboardStackedBarChartConfig>();

  legendData = computed(() => this.config().data);

  chartOptions = computed<StackedBarChartOptions>(() => {
    const conf = this.config();
    const data = conf.data || [];
    const colors = conf.colors || ['#10b981', '#ef4444', '#6366f1', '#f59e0b', '#94a3b8'];
    const height = conf.height || 40;

    const series = data.map(item => ({
      name: item.label,
      data: [item.value]
    }));

    return {
      series: series,
      chart: {
        type: 'bar',
        height: height,
      stacked: true,
      stackType: '100%',
      toolbar: { show: false },
      sparkline: { enabled: true }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '100%',
        borderRadius: 4,
        borderRadiusApplication: 'around',
        borderRadiusWhenStacked: 'all'
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      width: 0
    },
    xaxis: {
      categories: ['Attendance'],
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      show: false
    },
    tooltip: {
      y: {
        formatter: (val) => val.toString()
      }
    },
      legend: {
        show: false // We use custom legend
      },
      colors: colors
    };
  });
}
