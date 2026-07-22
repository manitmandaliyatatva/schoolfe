import { createGenericStore } from "../../../../../core/store/resource.store";

export interface SpecialDayOverride {
  specialDayOverrideId: string;
  overrideDate: Date | string | null;
  dayType: number; // OverrideDayTypes enum
  dayTypeName?: string;
  reason: string;
  specialDayOverrideGroupId?: string | null;
  specialDayOverrideGroupName?: string | null;
  isActive: boolean;
  isDeleted?: boolean;
  createdBy?: string | null;
  isEditable?: boolean;
}

export const SPECIAL_DAY_OVERRIDE_CONST = {
  SPECIAL_DAY_OVERRIDE_ID: 'Special Day Override ID',
  OVERRIDE_DATE: 'Override Date',
  DAY_TYPE: 'Day Type',
  TARGET_GROUP: 'Target Group',
  REASON: 'Reason',
  SPECIAL_DAY_OVERRIDE_DETAILS: 'Special Day Override Details',
  WARNING_HOLIDAY: 'The selected date is already holiday/weekend.',
  WARNING_WORKING_DAY: 'The selected date is already working day.',
  CREATED_BY: 'Created By'
};

export const specialDayOverrideStore = createGenericStore<SpecialDayOverride>();
