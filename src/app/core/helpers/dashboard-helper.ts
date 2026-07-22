import { DASHBOARD_SHARED_CONSTANTS } from "../constants/system.constant";

export interface AttendanceCounts {
  totalPresentDay?: number;
  totalAbsentDay?: number;
  totalHalfDay?: number;
  totalLateDay?: number;
}

export interface AttendanceStatus {
  attendanceStatusName: string;
  colorCode: string;
}

export class DashboardHelper {
  static prepareAttendanceChart(
    counts: AttendanceCounts | undefined,
    total: number,
    statuses: AttendanceStatus[],
    showPending: boolean = true
  ) {
    if (!counts) return { data: [], colors: [] };

    const getStatusColor = (label: string) => {
      const status = statuses.find(s => 
        s.attendanceStatusName.toLowerCase().includes(label.toLowerCase())
      );
      return status?.colorCode || '#cbd5e1';
    };

    const present = counts.totalPresentDay || 0;
    const absent = counts.totalAbsentDay || 0;
    const halfDay = counts.totalHalfDay || 0;
    const late = counts.totalLateDay || 0;

    const data = [
      { label: DASHBOARD_SHARED_CONSTANTS.LABELS.PRESENT, value: present },
      { label: DASHBOARD_SHARED_CONSTANTS.LABELS.ABSENT, value: absent },
      { label: DASHBOARD_SHARED_CONSTANTS.LABELS.LATE, value: late },
      { label: DASHBOARD_SHARED_CONSTANTS.LABELS.HALF_DAY, value: halfDay }
    ];

    const colors = [
      getStatusColor(DASHBOARD_SHARED_CONSTANTS.LABELS.PRESENT),
      getStatusColor(DASHBOARD_SHARED_CONSTANTS.LABELS.ABSENT),
      getStatusColor(DASHBOARD_SHARED_CONSTANTS.LABELS.LATE),
      getStatusColor(DASHBOARD_SHARED_CONSTANTS.LABELS.HALF_DAY)
    ];

    if (showPending) {
      const pending = Math.max(0, total - (present + absent + halfDay + late));
      data.push({ label: DASHBOARD_SHARED_CONSTANTS.LABELS.PENDING, value: pending });
      colors.push('#a1a4adff');
    }

    return { data, colors };
  }
}
