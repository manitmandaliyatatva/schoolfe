import { importProvidersFrom } from '@angular/core';
import { Route } from '@angular/router';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { CalendarListComponent } from './list/calendar-list';

export const TEACHER_CALENDAR_ROUTES: Route[] = [
    {
        path: '',
        component: CalendarListComponent,
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
