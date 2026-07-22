import { inject, Injectable, computed, effect } from "@angular/core";
import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";
import { WeeklyOffLookupStore } from "../store/weekly-off-lookup.store";
import { AuthStore } from "../store/auth.store";
import { HolidayType } from "../../shared/constants/holiday-type.constant";
import CommonHelper from "../helpers/common-helper";
import { SYSTEM_CONST } from "../constants/system.constant";
import { createGenericStore } from "../store/resource.store";
import { API } from "../../shared/constants/api-url";
import { Observable, tap } from 'rxjs';
import { CommonDateFormat } from "../constants/date-format.constant";

export interface HolidayLookup {
  date: string | Date | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  holidayType: number;
  noticeGroupId?: string | null;
  holidayName?: string;
}

export interface GetHolidayListPayload {
  startDate?: string | null;
  endDate?: string | null;
  audienceGroupId?: string | null;
  isForTeacher?: boolean | null;
  classSectionId?: string | null;
  classId?: string | null;
}

const GenericHolidayStore = createGenericStore<HolidayLookup>();

@Injectable({ providedIn: 'root' })
export class HolidayHelperService {
    private holidayStore = inject(GenericHolidayStore);
    private weeklyOffStore = inject(WeeklyOffLookupStore);
    private authStore = inject(AuthStore);
    readonly list = this.holidayStore.list;

    readonly excludeDates = computed(() => this.holidayStore.list().map(h => new Date(h.date as any)));
    readonly excludeWeekdays = computed(() => this.weeklyOffStore.list().filter(item => item.weekNumber?.includes(0)).map(item => item.weekDay));
    readonly weeklyOffs = computed(() => this.weeklyOffStore.list());

    constructor() {
        effect(() => {
            const data = this.holidayStore.data();
            if (data && Array.isArray(data)) {
                this.holidayStore.setList(data);
            }
        });
    }

    isWeekend = (
        date: string | Date | null
    ): boolean => {
        if (!date) return false;

        const list = this.holidayStore.list();

        const selectedDateStr = CommonHelper.toDateOnly(date);
        return list.some(h => 
            h.holidayType === HolidayType.WeekOff && 
            CommonHelper.toDateOnly(h.date) === selectedDateStr
        );
    };

    isDuplicateHoliday = (
        date: string | Date | null,
        originalStartDate?: string | Date | null,
        originalEndDate?: string | Date | null
    ): boolean => {
        if (!date) return false;

        const list = this.holidayStore.list();
        const selectedDateStr = CommonHelper.toDateOnly(date);
        const targetDate = new Date(selectedDateStr);
        targetDate.setHours(0, 0, 0, 0);

        let origStart: Date | null = null;
        let origEnd: Date | null = null;
        if (originalStartDate) {
            origStart = new Date(CommonHelper.toDateOnly(originalStartDate));
            origStart.setHours(0, 0, 0, 0);
            origEnd = originalEndDate ? new Date(CommonHelper.toDateOnly(originalEndDate)) : new Date(origStart);
            origEnd.setHours(0, 0, 0, 0);
        }

        return list.some(h => {
            if (h.holidayType !== HolidayType.Holiday) return false;
            if (!h.date) return false;

            const holidayDateStr = CommonHelper.toDateOnly(h.date);
            if (holidayDateStr !== selectedDateStr) return false;

            if (origStart && origEnd) {
                if (targetDate >= origStart && targetDate <= origEnd) {
                    return false;
                }
            }

            return true;
        });
    };

    isExamGroupHoliday = (
        date: string | Date | null
    ): boolean => {
        if (!date) return false;

        const list = this.holidayStore.list();
        const selectedDateStr = CommonHelper.toDateOnly(date);
        return list.some(h => 
            h.holidayType === HolidayType.ExamGroupHoliday && 
            CommonHelper.toDateOnly(h.date) === selectedDateStr
        );
    };

    checkHolidayStatus = (
        date: string | Date | null,
        currentHolidayDate?: string | Date | null,
        checkTypes?: HolidayType[]
    ): { isWeekOff: boolean; isHoliday: boolean; isExamGroupHoliday: boolean } => {
        const result = { isWeekOff: false, isHoliday: false, isExamGroupHoliday: false };
        if (!date) return result;

        const activeTypes = checkTypes ?? [HolidayType.WeekOff, HolidayType.Holiday, HolidayType.ExamGroupHoliday];

        if (activeTypes.includes(HolidayType.WeekOff)) {
            result.isWeekOff = this.isWeekend(date);
        }

        if (activeTypes.includes(HolidayType.Holiday)) {
            result.isHoliday = this.isDuplicateHoliday(date, currentHolidayDate);
        }

        if (activeTypes.includes(HolidayType.ExamGroupHoliday)) {
            result.isExamGroupHoliday = this.isExamGroupHoliday(date);
        }

        if (result.isExamGroupHoliday) {
            result.isHoliday = true;
        }

        return result;
    };

    getWarning = (
        date: string | Date | null,
        currentHolidayDate?: string | Date | null,
        checkTypes?: HolidayType[],
        customWarningMessage?: string
    ): string | null => {
        if (!date) return null;

        const status = this.checkHolidayStatus(date, currentHolidayDate, checkTypes);
        if (status.isHoliday || status.isWeekOff || status.isExamGroupHoliday) {
            return customWarningMessage ?? SYSTEM_CONST.HOLIDAY.WARNING_HOLIDAY;
        }
        return null;
    };

    getLastWorkingDay = (baseDate?: string | Date): Date => {
        const date = baseDate ? new Date(baseDate) : new Date();
        date.setHours(0, 0, 0, 0);

        const storeExcludes = this.excludeDates();

        while (true) {
            const isExcluded = storeExcludes.some(d =>
                d.getFullYear() === date.getFullYear() &&
                d.getMonth() === date.getMonth() &&
                d.getDate() === date.getDate()
            );

            if (!isExcluded) {
                return date;
            }
            date.setDate(date.getDate() - 1);
        }
    };

    subtractWorkingDays = (baseDate: string | Date, days: number): Date => {
        const date = new Date(baseDate);
        date.setHours(0, 0, 0, 0);

        const storeExcludes = this.excludeDates();
        let remainingDays = days;

        while (remainingDays > 0) {
            date.setDate(date.getDate() - 1);
            const isExcluded = storeExcludes.some(d =>
                d.getFullYear() === date.getFullYear() &&
                d.getMonth() === date.getMonth() &&
                d.getDate() === date.getDate()
            );

            if (!isExcluded) {
                remainingDays--;
            }
        }
        return date;
    };

    loadHolidays = (
        payload?: GetHolidayListPayload,
        ignoreDefaultDates: boolean = false
    ): Observable<HolidayLookup[] | null> => {
        const requestBody = { ...payload };

        if (!ignoreDefaultDates) {
            if (!requestBody.startDate) {
                requestBody.startDate = CommonHelper.toDateOnly(new Date());
            }
            if (!requestBody.endDate) {
                requestBody.endDate = CommonHelper.toDateOnly(this.authStore.academicyearenddate());
            }
        }

        this.holidayStore.resetState();

        return (this.holidayStore.createWithResult({
            endpoint: API.ADMIN.CONFIGURATION.HOLIDAY.GET_ALL,
            body: requestBody as any
        }) as unknown as Observable<HolidayLookup[] | null>).pipe(
            tap((holidays) => {
                if (holidays && Array.isArray(holidays)) {
                    this.holidayStore.setList(holidays);
                }
            })
        );
    };

    getDuplicateHolidayDate = (
        startDate: string | Date | null,
        endDate: string | Date | null,
        originalStartDate?: string | Date | null,
        originalEndDate?: string | Date | null
    ): string | null => {
        if (!startDate) return null;

        const start = new Date(CommonHelper.toDateOnly(startDate));
        const end = endDate ? new Date(CommonHelper.toDateOnly(endDate)) : new Date(start);

        const duplicateDates: string[] = [];
        let current = new Date(start);
        while (current <= end) {
            if (this.isDuplicateHoliday(current, originalStartDate, originalEndDate)) {
                duplicateDates.push(CommonHelper.toFormattedDate(current, CommonDateFormat.DDMMYYYY_WithSlash));
            }
            current.setDate(current.getDate() + 1);
        }

        if (duplicateDates.length === 0) return null;
        if (duplicateDates.length <= 3) {
            return duplicateDates.join(', ');
        }
        const firstThree = duplicateDates.slice(0, 3).join(', ');
        const remaining = duplicateDates.length - 3;
        return `${firstThree} and ${remaining} other days`;
    };

    duplicateHolidayValidator = (
        originalStartDateGetter?: () => string | Date | null,
        originalEndDateGetter?: () => string | Date | null,
        endDateGetter?: () => string | Date | null
    ): ValidatorFn => {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control || !control.value) return null;

            const originalStartDate = originalStartDateGetter ? originalStartDateGetter() : null;
            const originalEndDate = originalEndDateGetter ? originalEndDateGetter() : null;
            const endDate = endDateGetter ? endDateGetter() : null;

            const duplicateDate = this.getDuplicateHolidayDate(control.value, endDate, originalStartDate, originalEndDate);

            if (duplicateDate) {
                return { duplicateHoliday: { date: duplicateDate } };
            }
            return null;
        };
    };

    clearHolidays = (): void => {
        this.holidayStore.resetState();
    };
}
