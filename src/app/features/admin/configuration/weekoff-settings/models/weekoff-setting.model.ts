import { createGenericStore } from "../../../../../core/store/resource.store";

export interface WeekdaysOff {
    weekDay: number;
    weekNumber: number[];
}

export const weekdaysOffStore = createGenericStore<WeekdaysOff[]>();

export const GENERAL_SETTINGS_CONST = {
    TABS: {
        WEEKDAYS_OFF: "Weekdays Off"
    },
    WEEKDAYS_OFF: {
        HEADERS: {
            DAY_OF_WEEK: "Day of the Week",
            ALL_WEEKS: "All Weeks",
            WEEK_PREFIX: "Week"
        },
        FORM_CONTROLS: {
            WEEKDAYS_OFF_ARRAY: "weekdaysOff",
            DAY: "day",
            ALL_WEEKS: "allWeeks",
            WEEK_PREFIX: "week"
        },
        TOOLTIP: {
            EDIT: "Edit Settings"
        }
    }
};
