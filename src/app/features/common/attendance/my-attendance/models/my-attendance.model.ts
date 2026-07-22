import { ApexNonAxisChartSeries, ApexChart, ApexPlotOptions, ApexDataLabels, ApexStroke, ApexTooltip, ApexLegend } from "apexcharts";
import { IPaginationRequest } from "../../../../../core/models/request.model";

export interface IDynamicStat {
  code: string;
  name: string;
  count: number;
  percentage: number;
  color: string;
  bgColor: string;
}

export interface ICalendarCell {
  isEmpty: boolean;
  date?: number;
  isWeekend?: boolean;
  isHoliday?: boolean;
  status?: string;
  statusColor?: string;
  bgTint?: string;
  remark?: string;
}

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  colors: string[];
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  legend: ApexLegend;
};

export interface IAttendanceStatusListRequest extends IPaginationRequest {
  isFromAttendanceStatus?: boolean;
}
