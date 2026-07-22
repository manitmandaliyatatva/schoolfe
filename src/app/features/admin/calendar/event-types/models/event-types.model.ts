import { createGenericStore } from "../../../../../core/store/resource.store";

export interface EventType {
  eventTypeId: string;
  eventTypeName: string;
  colorCode: string;
  isActive: boolean;
}

export const EVENT_TYPE_CONST = {
  EVENT_TYPE_ID: 'Event Type ID',
  EVENT_TYPE_NAME: 'Event Type Name',
  COLOR_CODE: 'Color Code',
  EVENT_TYPE: 'Event Type'
};

export const eventTypeStore = createGenericStore<EventType>();
