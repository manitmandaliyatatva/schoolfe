import { CommonDateFormat } from '../constants/date-format.constant';
import CommonHelper from './common-helper';

export const ToLocalISOString = (dateStr: Date | string | null) => {
  if (!dateStr) {
    return undefined;
  }

  const d = new Date(dateStr);

  // Check if the date is valid before proceeding
  if (isNaN(d.getTime())) {
    console.warn(`Invalid date string provided: ${dateStr}`);
    return undefined;
  }
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d;
};

export const ToUtcISOString = (dateTimeStr: string) => {
  return new Date(dateTimeStr).toISOString();
};


export const FormatTimeForApi = (value: Date | null): string => {
  if (!value) return '';
  const hh = String(value.getHours()).padStart(2, '0');
  const mm = String(value.getMinutes()).padStart(2, '0');
  const ss = String(value.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

export const ParseTimeToDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const [hour, minute, second] = value.split(':').map((v) => Number(v));
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  const date = new Date();
  date.setHours(hour, minute, Number.isFinite(second) ? second : 0, 0);
  return date;
};

export const FormatTimeTo12Hour = (value: string): string => {
  const [hourRaw, minuteRaw] = value.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;

  const suffix = hour >= 12 ? 'PM' : 'AM';
  const normalizedHour = hour % 12 || 12;
  return `${String(normalizedHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${suffix}`;
};

export const ToMinutes = (value?: string): number => {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const [hoursRaw, minutesRaw] = value.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return Number.MAX_SAFE_INTEGER;
  return hours * 60 + minutes;
};

export const MergeDateTime = (date: Date | string | null, time: any): string => {
  if (!date) return '';
  const d = new Date(date);
  if (time) {
    if (time instanceof Date) {
      d.setHours(time.getHours(), time.getMinutes(), 0, 0);
    } else if (typeof time === 'string') {
      const [hours, minutes] = time.split(':').map(Number);
      d.setHours(hours, minutes, 0, 0);
    }
  } else {
    d.setHours(0, 0, 0, 0);
  }
  return CommonHelper.toFormattedDate(d, CommonDateFormat.YYYYMMDDTHHmmss_WithDash);
};