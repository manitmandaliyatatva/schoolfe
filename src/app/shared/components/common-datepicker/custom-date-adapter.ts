import { Injectable, Optional, Inject } from '@angular/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import moment, { Moment } from 'moment';

@Injectable({ providedIn: 'root' })
export class CustomDateAdapter extends MomentDateAdapter {
  public mode: 'year' | 'month' | 'day' = 'day';

  constructor(@Optional() @Inject(MAT_DATE_LOCALE) dateLocale: string) {
    super(dateLocale);
  }

  public override format(date: Moment, displayFormat: any): string {
    if (this.mode === 'year') {
      return date.format('YYYY');
    }
    return super.format(date, displayFormat);
  }

  public override parse(
    value: any,
    parseFormat?: string | string[]
  ): Moment | null {
    if (value == null) return null;

    if (moment.isMoment(value)) {
      return value.isValid() ? value.clone() : null;
    }
    if (value instanceof Date) {
      return moment(value);
    }

    if (this.mode === 'year') {
      const yearStr = String(value).trim();
      if (/^\d{4}$/.test(yearStr)) {
        return moment(`${yearStr}-01-01`, 'YYYY-MM-DD');
      }
    }

    const date = this.parseCustomDate(value);
    return date ? moment(date, 'DD/MM/YYYY') : null;
  }

  parseCustomDate(value: moment.Moment): string | null {
    const formats = [
      'DDMMYYYY', 
      'DDMMYY', 
      'DD MM YYYY',
      'DD MM YY',
      'DD/MM/YYYY',
      'DD/MM/YY',
      'D/M/YY',
      'D/M/YYYY',
      'DD-MM-YYYY',
      'DD-MM-YY',
      'D-M-YY',
      'D-M-YYYY',
      'D MMM YYYY',
      'D M YY',
      'D M YYYY',
      'D MM YY',
      'D-MMM-YYYY',
      'DMMMYYYY',
      'DMMMYY',
      'DD/MMM/YYYY',
      'DD/MMM/YY',
      'DD-MMM-YYYY',
      'DD-MMM-YY',
    ];

    for (const format of formats) {
      const parsedDate = moment(value, format, true);
      if (parsedDate.isValid()) {
        return parsedDate.format('DD/MM/YYYY');
      }
    }
    return null;
  }

}
