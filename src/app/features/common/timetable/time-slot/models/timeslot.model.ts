import { createGenericStore } from "../../../../../core/store/resource.store";

export interface Timeslot {
  timeSlotId: string;
  startTime: string;
  endTime: string;
  slotName: string;
  name: string;
  isBreak: boolean;
  isActive: boolean;
}

export const TIMESLOT_CONST = {
  TIMESLOT_ID: 'Time Slot ID',
  SLOT_NAME: 'Slot Name',
  IS_BREAK: 'Is Break?',
  BREAK: 'Break',
};

export const timeslotStore = createGenericStore<Timeslot>();
