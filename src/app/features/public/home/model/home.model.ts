import { createGenericStore } from "../../../../core/store/resource.store";
import { NewsAnnouncement } from "../../../admin/public-site/news-announcement/models/news-anouncement.model";
import { ITestimonials } from "../../../admin/public-site/testimonials/model/testimonial.model";

export interface ISiteCarousel{
    carouselId : string,
    title : string,
    description : string;
    buttonText : string;
    buttonLink : string;
    imageUrl : string;
    displayOrder : number;
    isActive : boolean;
}

export const homeSiteStore = createGenericStore<ISiteCarousel>();
export const testimonialSiteStore = createGenericStore<ITestimonials>();
export const newsStore = createGenericStore<NewsAnnouncement>();
import { Branch } from "../../../admin/configuration/branch/models/branch.model";
export const branchSiteStore = createGenericStore<Branch>();