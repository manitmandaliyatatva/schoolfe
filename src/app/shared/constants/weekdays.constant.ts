import { SYSTEM_CONST } from "../../core/constants/system.constant";
import { ITextValueOption } from "../models/common.model";

export const WeekDaysConst = {
    [SYSTEM_CONST.WEEKDAYS.MONDAY]: 1,
    [SYSTEM_CONST.WEEKDAYS.TUESDAY]: 2,
    [SYSTEM_CONST.WEEKDAYS.WEDNESDAY]: 3,
    [SYSTEM_CONST.WEEKDAYS.THURSDAY]: 4,
    [SYSTEM_CONST.WEEKDAYS.FRIDAY]: 5,
    [SYSTEM_CONST.WEEKDAYS.SATURDAY]: 6,
}

export const AllWeekDaysConst = {
    ...WeekDaysConst,
    [SYSTEM_CONST.WEEKDAYS.SUNDAY]: 0
}