import { pendingChangesGuard } from '../../../core/guards/pending-changes.guard';
import { Route } from "@angular/router";
import { authGuard } from "../../../core/guards/auth-guard";
import { CarouselForm } from "./carousel/form/carousel-form";
import { PublicSiteComponent } from "./public-site";
import { ADMIN_ROUTE } from "../../../shared/constants/route.constant";
import { CarouselList } from "./carousel/list/carousel-list";
import { TestimonialForm } from "./testimonials/form/testimonial-form";
import { TestimonialList } from "./testimonials/list/testimonial-list";
import { NewsAnnouncementForm } from "./news-announcement/form/news-announcement-form";
import { NewsAnnouncementList } from "./news-announcement/list/news-announcement-list";
import { FacilityForm } from "./facility/form/facility-form";
import { FacilityList } from "./facility/list/facility-list";
import { ConatctusList } from "./contactus/list/conatctus-list";
import { MetaInformationForm } from "./meta-information/form/meta-information-form";

export const PUBLIC_SITE_ROUTE: Route[] = [
    {
        path: '',
        component: PublicSiteComponent,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'add-carousel',
            },
            {
                path: ADMIN_ROUTE.SITE_CONFIGURATION.CAROUSEL.ADD,
                component: CarouselForm,
                title: 'Add Carousel',
            //canDeactivate: [pendingChangesGuard],
                },
            {
                path: ADMIN_ROUTE.SITE_CONFIGURATION.CAROUSEL.EDIT,
                component: CarouselForm,
                title: 'Edit Carousel',
            //canDeactivate: [pendingChangesGuard],
                },
            {
                path: ADMIN_ROUTE.SITE_CONFIGURATION.CAROUSEL.LIST,
                component: CarouselList,
                title: 'Carousels',
            },
            {
                path: ADMIN_ROUTE.SITE_CONFIGURATION.TESTIMONIAL.ADD,
                component: TestimonialForm,
                title: 'Add Testimonial',
            //canDeactivate: [pendingChangesGuard],
                },
            {
                path: ADMIN_ROUTE.SITE_CONFIGURATION.TESTIMONIAL.EDIT,
                component: TestimonialForm,
                title: 'Edit Testimonial',
            //canDeactivate: [pendingChangesGuard],
                },
            {
                path: ADMIN_ROUTE.SITE_CONFIGURATION.TESTIMONIAL.LIST,
                component: TestimonialList,
                title: 'Testimonials',
            },
            {
                path: ADMIN_ROUTE.SITE_CONFIGURATION.NEWS_ANNOUNCEMENT.ADD,
                component: NewsAnnouncementForm,
                title: 'Add News Announcement',
            //canDeactivate: [pendingChangesGuard],
                },
            {
                path: ADMIN_ROUTE.SITE_CONFIGURATION.NEWS_ANNOUNCEMENT.EDIT,
                component: NewsAnnouncementForm,
                title: 'Edit News Announcement',
            //canDeactivate: [pendingChangesGuard],
                },
            {
                path: ADMIN_ROUTE.SITE_CONFIGURATION.NEWS_ANNOUNCEMENT.LIST,
                component: NewsAnnouncementList,
                title: 'News Announcement',
            },
            {
                path: ADMIN_ROUTE.SITE_CONFIGURATION.FACILITY.ADD,
                component: FacilityForm,
                title: 'Add Facility',
            //canDeactivate: [pendingChangesGuard],
                },
            {
                path: ADMIN_ROUTE.SITE_CONFIGURATION.FACILITY.EDIT,
                component: FacilityForm,
                title: 'Edit Facility',
            //canDeactivate: [pendingChangesGuard],
                },
            {
                path: ADMIN_ROUTE.SITE_CONFIGURATION.FACILITY.LIST,
                component: FacilityList,
                title: 'Facility',
            },
            {
                path: ADMIN_ROUTE.SITE_CONFIGURATION.CONTACTUS,
                component: ConatctusList,
                title: 'Contact Us Inquiry',
            },
            {
                path: ADMIN_ROUTE.SITE_CONFIGURATION.META_INFORMATION_ADD,
                component: MetaInformationForm,
                title: 'Meta Information',
            //canDeactivate: [pendingChangesGuard],
                },
            {
                path: ADMIN_ROUTE.SITE_CONFIGURATION.META_INFORMATION_EDIT,
                component: MetaInformationForm,
                title: 'Meta Information',
            //canDeactivate: [pendingChangesGuard],
                },
        ],
    },
]
