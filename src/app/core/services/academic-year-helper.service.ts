import { Injectable, inject } from '@angular/core';
import CommonHelper from '../helpers/common-helper';
import { CommonDateFormat } from '../constants/date-format.constant';
import { ITextValueOption } from '../../shared/models/common.model';
import { AuthStore } from '../store/auth.store';
import { HolidayHelperService } from './holiday-helper.service';

@Injectable({ providedIn: 'root' })
export class AcademicYearHelperService {
  private readonly authStore = inject(AuthStore);
  private readonly holidayHelper = inject(HolidayHelperService);

  private getStoreDateWithFallback(
    dateStr: string | null | undefined,
    fallbackDate: Date,
    isEndOfDay: boolean = false
  ): Date {
    let resultDate = fallbackDate;

    if (dateStr) {
      const parsed = CommonHelper.parseDateString(dateStr);
      if (parsed) {
        resultDate = parsed;
      }
    }

    isEndOfDay ? resultDate.setHours(23, 59, 59, 999) : resultDate.setHours(0, 0, 0, 0);

    return resultDate;
  }

  getDatepickerMinDate = (): Date => {
    const today = new Date();
    const ayStart = this.getAcademicYearStartDate();
    if (today < ayStart) {
      return ayStart;
    }
    return this.getStoreDateWithFallback(
      today.toString(),
      today
    );
  };

  getAcademicYearStartDate = (): Date => {
    return this.getStoreDateWithFallback(
      this.authStore.academicyearstartdate(),
      CommonHelper.getmaxDateByYear(-1)
    );
  };

  getDatepickerMaxDate = (): Date => {
    return this.getStoreDateWithFallback(
      this.authStore.academicyearenddate(),
      CommonHelper.getmaxDateByYear(1),
      true
    );
  };

  isAttendanceDisabled = (date: string | Date | null): boolean => {
    if (!date) return true;

    if (this.authStore.iscurrentacademicyear() === false) {
      return true;
    }

    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    const holidayStatus = this.holidayHelper.checkHolidayStatus(selectedDate);
    if (holidayStatus.isHoliday || holidayStatus.isWeekOff) {
      return true;
    }

    if (this.authStore.isTeacher()) {
      const minEditableDate = this.holidayHelper.subtractWorkingDays(new Date(), 7);
      minEditableDate.setHours(0, 0, 0, 0);
      if (selectedDate < minEditableDate) {
        return true;
      }
    }

    return false;
  };

  getAttendanceMaxDate = (): Date => {
    const ayStartDate = this.getAcademicYearStartDate();
    const ayEndDate = this.getDatepickerMaxDate();
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (today < ayStartDate) {
      return ayEndDate;
    }

    return today < ayEndDate ? today : ayEndDate;
  };

  getValidAttendanceDate = (targetDate: Date = new Date()): Date => {
    const ayStart = this.getAcademicYearStartDate();
    const ayEnd = this.getAttendanceMaxDate();
    
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    ayStart.setHours(0, 0, 0, 0);

    if (target < ayStart || target > ayEnd) {
      const date = new Date(ayStart);
      while (true) {
        const holidayStatus = this.holidayHelper.checkHolidayStatus(date);
        if (!holidayStatus.isHoliday && !holidayStatus.isWeekOff) {
          return date;
        }
        date.setDate(date.getDate() + 1);
      }
    } else {
      const date = new Date(targetDate);
      while (true) {
        const holidayStatus = this.holidayHelper.checkHolidayStatus(date);
        if (!holidayStatus.isHoliday && !holidayStatus.isWeekOff) {
          return date;
        }
        date.setDate(date.getDate() - 1);
      }
    }
  };

  generateMonthYearOptions = (): ITextValueOption[] => {
    const startDate = this.getAcademicYearStartDate();
    const endDate = this.getDatepickerMaxDate();
    
    const options: ITextValueOption[] = [];
    const current = new Date(startDate);
    current.setDate(1); // start at the first of the month

    const end = new Date(endDate);
    end.setDate(1); // compare against the first of the month
    
    while (current <= end) {
      const month = current.getMonth() + 1;
      const year = current.getFullYear();
      
      options.push({
        text: CommonHelper.toFormattedDate(current, CommonDateFormat.MMMMYYYY_WithSpace),
        value: `${year}-${month.toString().padStart(2, '0')}`
      });
      
      current.setMonth(current.getMonth() + 1);
    }

    return options;
  };
}
