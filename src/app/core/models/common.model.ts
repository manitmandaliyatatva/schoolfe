import { MatDateFormats } from "@angular/material/core";

export const VERBOSE_NATIVE_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: null,
  },
  display: {
    dateInput: { month: 'long', day: '2-digit', year: 'numeric' },
    monthYearLabel: { month: 'short', year: 'numeric' },
    dateA11yLabel: { month: 'long', day: 'numeric', year: 'numeric' },
    monthYearA11yLabel: { month: 'long', year: 'numeric' },
  },
};

export enum ButtonType {
  Add,
  Edit,
  View,
  Delete,
  Download
}