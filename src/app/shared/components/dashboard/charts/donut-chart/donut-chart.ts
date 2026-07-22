import { ChangeDetectionStrategy, Component, ViewChild, signal, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ApexNonAxisChartSeries,
  ApexChart,
  ApexResponsive,
  ApexDataLabels,
  ApexLegend,
  ApexStroke,
  ApexPlotOptions,
  ApexTooltip,
  NgApexchartsModule,
  ChartComponent
} from 'ng-apexcharts';

export type DonutChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  colors: string[];
  stroke: ApexStroke;
  plotOptions: ApexPlotOptions;
  tooltip: ApexTooltip;
};

export interface IDashboardDonutChartConfig {
  series: number[];
  labels: string[];
  colors?: string[];
  height?: number;
}

@Component({
  selector: 'app-dashboard-donut-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="chart-wrapper">
      <!-- Custom Legend with counts -->
      <div class="custom-legend">
        <div class="legend-list">
          <div class="legend-item" *ngFor="let label of config().labels; let i = index">
            <div class="legend-indicator" [style.background-color]="(config().colors || ['#10b981', '#ef4444', '#f59e0b', '#6366f1', '#94a3b8'])[i]"></div>
            <div class="legend-content">
              <div class="legend-value">{{ config().series[i] || 0 }}</div>
              <div class="legend-label">{{ label }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-container">
        <apx-chart
          #chart
          [series]="chartOptions().series"
          [chart]="chartOptions().chart"
          [labels]="chartOptions().labels"
          [colors]="chartOptions().colors"
          [dataLabels]="chartOptions().dataLabels"
          [legend]="chartOptions().legend"
          [responsive]="chartOptions().responsive"
          [stroke]="chartOptions().stroke"
          [plotOptions]="chartOptions().plotOptions"
          [tooltip]="chartOptions().tooltip"
        ></apx-chart>
      </div>
    </div>
  `,
  styles: [`
    .chart-wrapper {
      width: 100%;
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      justify-content: center;
      gap: 32px;
      padding: 10px 0;
      margin-top: 8px;
    }
    .chart-container {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 220px;
    }
    .custom-legend {
      padding: 0 16px;
    }
    .legend-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .legend-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .legend-indicator {
      width: 4px;
      height: 20px;
      border-radius: 2px;
      margin-top: 4px;
    }
    .legend-content {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }
    .legend-value {
      font-size: 20px;
      font-weight: 700;
      color: #1e293b;
    }
    .legend-label {
      font-size: 13px;
      font-weight: 500;
      color: #64748b;
    }
    :host ::ng-deep .apexcharts-canvas {
      margin: 0 auto;
    }

    @media (max-width: 1200px) {
      .chart-wrapper {
        flex-direction: column-reverse;
        align-items: center;
        gap: 24px;
        padding: 5px 0;
      }
      .chart-container {
        min-height: 180px;
      }
      .custom-legend {
        width: 100%;
        padding: 0;
      }
      .legend-list {
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
        gap: 16px 24px;
      }
      .legend-item {
        gap: 8px;
      }
      .legend-value {
        font-size: 16px;
      }
      .legend-label {
        font-size: 12px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardDonutChart {
  @ViewChild('chart') chart!: ChartComponent;
  config = input.required<IDashboardDonutChartConfig>();

  chartOptions = computed<DonutChartOptions>(() => {
    const conf = this.config();
    const series = conf.series || [];
    const labels = conf.labels || [];
    const colors = conf.colors || ['#10b981', '#ef4444', '#f59e0b', '#6366f1', '#94a3b8'];
    const height = conf.height || 220;

    const sum = series.reduce((a, b) => a + b, 0);
    const isAllZero = sum === 0 && series.length > 0;

    return {
      series: isAllZero ? [1] : series,
      chart: {
        type: 'donut',
        height: height,
      animations: {
        enabled: true,
        speed: 800
      },
      toolbar: {
        show: false
      }
    },
      dataLabels: {
        enabled: false
      },
      labels: isAllZero ? ['No Data'] : labels,
      colors: isAllZero ? ['#a1a4ad'] : colors,
      stroke: {
      show: true,
      width: 2,
      colors: ['#ffffff']
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
                  label: 'Total',
                  formatter: () => isAllZero ? '0' : sum.toString()
                }
              }
            }
          }
        },
        legend: {
          show: false
        },
        tooltip: {
          enabled: true,
          y: {
            formatter: function (val: number) {
              return isAllZero ? '' : val.toString();
            },
            title: {
              formatter: function (seriesName: string) {
                return isAllZero ? seriesName : seriesName + ':';
              }
            }
          }
        },
        responsive: [
          {
            breakpoint: 480,
            options: {
              chart: {
                width: 200
              },
              legend: {
                position: 'bottom'
              }
            }
          }
        ]
    };
  });
}
