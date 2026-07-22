import { pendingChangesGuard } from '../../../core/guards/pending-changes.guard';
import { importProvidersFrom } from '@angular/core';
import { Route } from '@angular/router';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { EventTypesForm } from './event-types/form/event-types-form';
import { EventTypesComponent } from './event-types/list/event-types';
import { CalendarListComponent } from './calendar/list/calendar-list';
import { EventsForm } from './events/form/events-form';
import { EventsListComponent } from './events/list/events-list';
import { GetPageTitle, TITLES } from '../../../shared/constants/title.constant';

export const CALENDAR_ROUTES: Route[] = [
    {
        path: 'event-types',
        component: EventTypesComponent,
        title: GetPageTitle(TITLES.ADMIN.EVENT_TYPE),
    },
    {
        path: 'event-types/add',
        component: EventTypesForm,
        title: GetPageTitle(TITLES.ADMIN.EVENT_TYPE),
        //canDeactivate: [pendingChangesGuard],
    },
    {
        path: 'event-types/edit/:eventTypeId',
        component: EventTypesForm,
        title: GetPageTitle(TITLES.ADMIN.EVENT_TYPE),
        //canDeactivate: [pendingChangesGuard],
    },
    {
        path: 'events',
        component: EventsListComponent,
        title: GetPageTitle(TITLES.ADMIN.EVENTS),
    },
    {
        path: 'events/add',
        component: EventsForm,
        title: GetPageTitle(TITLES.ADMIN.EVENTS),
        //canDeactivate: [pendingChangesGuard],
    },
    {
        path: 'events/edit/:eventId',
        component: EventsForm,
        title: GetPageTitle(TITLES.ADMIN.EVENTS),
        //canDeactivate: [pendingChangesGuard],
    },
    {
        path: 'calendar',
        component: CalendarListComponent,
        title: GetPageTitle(TITLES.ADMIN.CALENDAR),
        providers: [
            importProvidersFrom(
                CalendarModule.forRoot({
                    provide: DateAdapter,
                    useFactory: adapterFactory,
                })
            )
        ]
    }
];
