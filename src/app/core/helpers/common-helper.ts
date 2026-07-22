import { AbstractControl } from "@angular/forms";
import { ERROR_CONST } from "../../shared/constants/error.constant";
import { formatDate } from "@angular/common";
import { CommonDateFormat } from "../constants/date-format.constant";
import { EMPTY_GUID } from "../../shared/constants/app.constants";
import { SYSTEM_CONST } from "../constants/system.constant";
import { CommonButtonConfig } from "../../shared/components/button/model/button.model";
import moment from 'moment';

export default class CommonHelper {
    static isJsonString = (str: string) => {
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    }

    static isNumber = (value: any): boolean => {
        return !isNaN(parseInt(value, 10));
    }

    static toBoolean = (value: any): boolean => {
        if (this.isEmpty(value)) return false;
        if (typeof value === 'boolean') return value;
        return String(value).toLowerCase() === 'true';
    }

    static isEmpty = (value: any): boolean => {
        return value === null || value === undefined || value === '';
    }

    static isEmptyGuid = (value: string) => {
        return this.isEmpty(value) || value.toLowerCase() == EMPTY_GUID.toLowerCase();
    }

    static resolveId = (value?: string | null): string => {
        return this.isEmpty(value) ? EMPTY_GUID : value!;
    }

    static compareGuid = (value: string, compareValue: string) => {
        return !this.isEmpty(value) && !this.isEmpty(compareValue) && value.toLowerCase() == compareValue.toLowerCase();
    }

    static isNotEmptyArray = (value: any): boolean => {
        return Array.isArray(value) && value.length > 0;
    }

    static isFormEmpty = (obj: any): boolean => {
        return Object.keys(obj).every((item) => obj[item] === '' || obj[item] === null || obj[item] === undefined)
    }

    static getEmailRegex = (): RegExp => {
        return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    }

    static isEmail = (str: string): boolean => {
        return this.getEmailRegex().test(str);
    }
    static interpolate = (template: string, params: Record<string, string | number>): string => {
        return Object.keys(params).reduce((result, key) => {
            return result.replace(new RegExp(`{{${key}}}`, 'g'), String(params[key]));
        }, template);
    };

    static normalizeString = (value?: string | null): string | null => CommonHelper.isEmpty(value) ? null : String(value).trim();

    static getErrorMessageFromErrorType = (
        errorType: string,
        control: AbstractControl,
        controlName?: string
    ): string => {
        if (!control?.errors || !control.errors[errorType]) return '';

        const thisFieldKey = ERROR_CONST.THIS_FIELD;
        const unknownsKey = ERROR_CONST.UNKNOWN;
        const rawErrorValue = control.errors[errorType];
        const customErrorMessage = typeof rawErrorValue === 'string' ? rawErrorValue : '';

        const errorMessageMapping: Record<string, string> = {
            [errorType]: customErrorMessage,
            'required': this.interpolate(ERROR_CONST.VALIDATIONS.REQUIRED, {
                name: controlName ?? thisFieldKey
            }),
            'pattern': ERROR_CONST.VALIDATIONS.PATTERN,
            'email': ERROR_CONST.VALIDATIONS.EMAIL,
            'phone': ERROR_CONST.VALIDATIONS.PHONE,
            'currency': ERROR_CONST.VALIDATIONS.CURRENCY,
            'minCurrenecy': this.interpolate(ERROR_CONST.VALIDATIONS.MIN_CURRENCY, {
                name: controlName ?? thisFieldKey,
                min: control.errors['minCurrenecy']?.min ?? '0'
            }),
            'onlyString': customErrorMessage || ERROR_CONST.VALIDATIONS.ONLY_STRING,
            'maxlength': this.interpolate(ERROR_CONST.VALIDATIONS.MAX_LENGTH, { length: control.errors['maxlength']?.requiredLength ?? unknownsKey }),
            'minlength': this.interpolate(ERROR_CONST.VALIDATIONS.MIN_LENGTH, { length: control.errors['minlength']?.requiredLength ?? unknownsKey }),
            'min': this.interpolate(ERROR_CONST.VALIDATIONS.GREATER_THAN_OR_EQUAL, {
                name: controlName ?? thisFieldKey,
                compareName: control.errors['min']?.min ?? unknownsKey
            }),
            'max': this.interpolate(ERROR_CONST.VALIDATIONS.LESS_THAN_OR_EQUAL, {
                name: controlName ?? thisFieldKey,
                compareName: control.errors['max']?.max ?? unknownsKey
            }),
            'matDatepickerFilter': ERROR_CONST.VALIDATIONS.DATE_PICKER_FILTER,
            'matDatepickerMin': this.interpolate(ERROR_CONST.VALIDATIONS.DATE_PICKER_MIN, {
                name: controlName ?? thisFieldKey,
                date: this.toFormattedDate(control.errors['matDatepickerMin']?.min, CommonDateFormat.DDMMYYYY_WithSlash) ?? unknownsKey
            }),
            'matDatepickerMax': this.interpolate(ERROR_CONST.VALIDATIONS.DATE_PICKER_MAX, {
                name: controlName ?? thisFieldKey,
                date: this.toFormattedDate(control.errors['matDatepickerMax']?.max, CommonDateFormat.DDMMYYYY_WithSlash) ?? unknownsKey
            }),
            'matTimepickerParse': this.interpolate(ERROR_CONST.VALIDATIONS.TIME_INVALID, {
                name: controlName ?? thisFieldKey
            }),
            'matTimepickerMin': this.interpolate(ERROR_CONST.VALIDATIONS.TIME_MIN, {
                name: controlName ?? thisFieldKey
            }),
            'matTimepickerMax': this.interpolate(ERROR_CONST.VALIDATIONS.TIME_MAX, {
                name: controlName ?? thisFieldKey
            }),
            'passwordMismatch': ERROR_CONST.VALIDATIONS.PASSWORD_MISMATCH,
            'sameAsOld': ERROR_CONST.VALIDATIONS.SAME_AS_OLD,
            'passwordPattern': ERROR_CONST.VALIDATIONS.PASSWORD_PATTERN,
            'duplicateHoliday': this.interpolate(ERROR_CONST.VALIDATIONS.DUPLICATE_HOLIDAY || '', {
                date: control.errors['duplicateHoliday']?.date ?? unknownsKey
            })
        };

        return errorMessageMapping[errorType] ?? '';
    }

    static isObjectEqual(item: any, element: any): boolean {
        return JSON.stringify(item) === JSON.stringify(element);
    }

    static toDateOnly = (value: string | Date | moment.Moment | null): string => {
        if (!value) return '';
        if (moment.isMoment(value)) {
            return value.format('YYYY-MM-DD');
        }
        return CommonHelper.toFormattedDate(value as any, CommonDateFormat.YYYYMMDD_WithDash);
    };

    static toFormattedDate = (value: string | Date | moment.Moment, formatStr: CommonDateFormat): string => {
        if (!value) return '';

        let parsedDate: Date;
        if (value instanceof Date) {
            parsedDate = value;
        } else if (moment.isMoment(value)) {
            parsedDate = value.toDate();
        } else {
            parsedDate = new Date(String(value).trim());
        }

        if (Number.isNaN(parsedDate.getTime())) return '';
        return formatDate(parsedDate, formatStr, 'en-US');
    };

    static getYearString = (value: any): string => {
        if (!value) return '';
        if (moment.isMoment(value)) {
            return value.format('YYYY');
        }
        if (value instanceof Date) {
            return String(value.getFullYear());
        }
        return String(value).trim();
    };

    static parseDateString = (dateStr: string, formatStr?: string): Date | null => {
        if (!dateStr) return null;
        const parsed = moment(dateStr, formatStr ?? 'YYYY-MM-DD');
        return parsed.isValid() ? parsed.toDate() : null;
    };

    static toSafeNumber = (value: unknown, fallback = 0): number => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    };

    static toNullableNumber = (value: unknown): number | null => {
        if (this.isEmpty(value)) return null;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    };

    static getmaxDateByYear = (years: number = 1, dependentDate?: string | Date): Date => {
        const date = dependentDate ? new Date(dependentDate) : new Date();
        date.setFullYear(date.getFullYear() + years);
        return date;
    };

    static getDateByYear = (years: number, dependentDate?: string): Date => {
        const date = dependentDate ? new Date(dependentDate) : new Date();
        date.setFullYear(date.getFullYear() - years);
        return date;
    };

    static getMinDateAfter = (offsetDays = 1, dateValue?: string | Date, fallbackYears = 100): Date => {
        if (dateValue) {
            const date = new Date(dateValue);
            date.setDate(date.getDate() + offsetDays);
            return date;
        }
        return CommonHelper.getDateByYear(fallbackYears);
    };
    static isWithinLast7Days(selectedDate: Date): boolean {
        if (!selectedDate) return false;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const selected = new Date(selectedDate);
        selected.setHours(0, 0, 0, 0);

        const diffTime = today.getTime() - selected.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        return diffDays <= 7;
    }

    static isPastDate = (value: Date | string | null | undefined, includeToday = false): boolean => {
        if (!value) return false;
        const targetDate = new Date(value);
        targetDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return includeToday ? targetDate <= today : targetDate < today;
    };

    static isTodayOrPastDate = (value: Date | string | null | undefined): boolean => {
        if (!value) return false;
        const targetDate = new Date(value);
        targetDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return targetDate <= today;
    };

    static isFutureEvent(startDate: string | Date, isAllDay: boolean): boolean {
        const start = new Date(startDate);
        const now = new Date();

        if (isAllDay) {
            const startDay = new Date(start);
            startDay.setHours(0, 0, 0, 0);
            const todayDay = new Date(now);
            todayDay.setHours(0, 0, 0, 0);
            return startDay > todayDay;
        } else {
            return start > now;
        }
    }

    static formatTimeAMPM = (timeStr: string): string => {
        if (!timeStr) return '';
        try {
            const [h, m] = timeStr.split(':').map(Number);
            const ampm = h >= 12 ? 'PM' : 'AM';
            const hours = h % 12 || 12;
            const minutes = m.toString().padStart(2, '0');
            return `${hours}:${minutes} ${ampm}`;
        } catch (e) {
            return timeStr;
        }
    }

    static calculateDuration = (start: string, end: string): string => {
        if (!start || !end) return '';

        try {
            const parseTime = (t: string) => {
                const [h, m] = t.split(':').map(Number);
                return h * 60 + m;
            };

            const diff = parseTime(end) - parseTime(start);
            if (diff <= 0) return '';

            const h = Math.floor(diff / 60);
            const m = diff % 60;

            let result = '';
            if (h > 0) result += `${h}h `;
            if (m > 0) result += `${m}m`;
            return result.trim();
        } catch (e) {
            return '';
        }
    }

    static getClassroomDisplay = (value: string | null | undefined): string => {
        if (!value) return '-';
        const parts = value.split(',').map(s => s.trim()).filter(Boolean);
        if (parts.length === 0) return '-';
        const first = parts[0];
        const parenIdx = first.lastIndexOf('(');
        const className = parenIdx > 0 ? first.slice(0, parenIdx).trim() : first;
        const sections = parts.map(p => {
            const m = p.match(/\(([^)]+)\)$/);
            return m ? m[1] : '';
        }).filter(Boolean);
        return sections.length > 0 ? `${className} (${sections.join(', ')})` : className;
    };

    static getRefreshButtonConfig = (callback: () => void, disableGlobalRefresh: boolean = false): CommonButtonConfig => ({
        variant: 'flat',
        color: 'primary',
        icon: 'refresh',
        tooltipText: SYSTEM_CONST.ACTION_BUTTONS.REFRESH,
        callback,
        cssClasses: ['square-icon-btn'],
        isGlobalRefreshButton: !disableGlobalRefresh
    });

    static calculateGrade = (percentage: number): string => {
        if (percentage >= 90) return 'A';
        if (percentage >= 70) return 'B';
        if (percentage >= 50) return 'C';
        return 'D';
    }
    static isPastAcademicYear = (isCurrentAY: boolean | null | undefined, academicYearEndDateStr: string | null | undefined): boolean => {
        const isCurrent = isCurrentAY !== false;
        if (isCurrent) return false;
        if (!academicYearEndDateStr) return false;
        const endDate = new Date(academicYearEndDateStr);
        endDate.setHours(23, 59, 59, 999);
        return new Date() > endDate;
    };
}
