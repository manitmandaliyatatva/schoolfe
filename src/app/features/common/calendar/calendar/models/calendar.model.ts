import { createGenericStore } from "../../../../../core/store/resource.store";
import { Base64Document } from "../../../../../shared/models/document.model";

export interface EventDto {
    eventId: string;
    eventTitle: string;
    description: string;
    eventTypeId: string;
    eventTypeName?: string;
    eventGroupId: string;
    eventGroupName?: string;
    startDate: string | Date;
    endDate: string | Date;
    isAllDay: boolean;
    location: string;
    isHoliday: boolean;
    isExam: boolean;
    eventFileName?: string;
    eventFilePath?: string;
    eventFile?: string;
    isFileDeleted: boolean;
    isActive: boolean;
    colorCode?: string;
    eventAudiences?: any[];
    allowToEditDelete?: boolean;
    isEditable?: boolean;
    createdByName?: string;
}

export const CALENDAR_CONST = {
    EVENTS: 'Events',
    EDIT_EVENT: 'Edit Event',
    ADD_EVENT: 'Add Event',
    DELETE_EVENT: 'Delete Event',
    EVENT_ATTACHMENT: 'Event Attachment',
    DESCRIPTION: 'Description',
    EVENT_GROUP: 'Audience Group',
    IS_ALL_DAY: 'All Day Event?',
    LOCATION: 'Location',
    EVENT_FILE: 'Attachment',
    INACTIVE_EVENT_TOOLTIP: 'This event is currently inactive',
    TITLE: 'Title',
    TYPE: 'Type',
    GROUP: 'Group',
    CANT_ADD_PAST_EVENT: "Can't add event for past date",
    CANT_ADD_EVENT_BEYOND: "Can't add event beyond Academic Year",
    CREATED_BY: 'Created By',
};

export const calendarStore = createGenericStore<EventDto>();
export const eventDocumentBase64Store = createGenericStore<Base64Document>();
