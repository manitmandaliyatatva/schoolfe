import { createGenericStore } from "../../../../../core/store/resource.store";
import { EventDto } from "../../../../common/calendar/calendar/models/calendar.model";

export type { EventDto };

export const EVENTS_CONST = {
    EVENTS: 'Events',
    ADD_EVENT: 'Add Event',
    EDIT_EVENT: 'Edit Event',
    VIEW_EVENT: 'View Event',
    EVENT_TITLE: 'Event Title',
    DESCRIPTION: 'Description',
    EVENT_TYPE: 'Event Type',
    EVENT_GROUP: 'Audience Group',
    IS_ALL_DAY: 'All Day Event?',
    LOCATION: 'Location',
    EVENT_FILE: 'Attachment',
    CREATED_BY: 'Created By',
};

export const eventStore = createGenericStore<EventDto>();
