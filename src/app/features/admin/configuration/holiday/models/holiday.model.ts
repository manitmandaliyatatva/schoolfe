import { createGenericStore } from "../../../../../core/store/resource.store";

export interface Holiday {
  holidayId: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  description: string;
  isRecurring?: boolean;
  holidayGroupId?: string | null;
  holidayGroupName?: string | null;
  isActive: boolean;
  createdBy?: string | null;
  isEditable?: boolean;
}

export const HOLIDAY_CONST = {
  HOLIDAY_ID: 'Holiday ID',
  HOLIDAY_NAME: 'Holiday Name',
  START_DATE: 'Start Date',
  END_DATE: 'End Date',
  TARGET_GROUP: 'Target Group',
  DESCRIPTION: 'Description',
  RECURRING: 'Recurring',
  HOLIDAY_DETAILS: 'Holiday Details',
  HOLIDAY_GROUP: 'Holiday Group',
  CREATED_BY: 'Created By',
};

export const holidayStore = createGenericStore<Holiday>();
