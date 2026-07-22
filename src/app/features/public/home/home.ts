import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  computed,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { homeSiteStore, ISiteCarousel, newsStore, testimonialSiteStore, branchSiteStore } from './model/home.model';
import { Branch } from '../../admin/configuration/branch/models/branch.model';
import { API } from '../../../shared/constants/api-url';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ITestimonials } from '../../admin/public-site/testimonials/model/testimonial.model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StarRatingConfig } from '../../../shared/components/star-rating/models/star-rating.model';
import { StarRating } from '../../../shared/components/star-rating/star-rating';
import { NewsAnnouncement } from '../../admin/public-site/news-announcement/models/news-anouncement.model';
import { PublicSettingStore } from '../../../core/store/public-setting.store';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule, StarRating, ReactiveFormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  store = inject(homeSiteStore);
  testimonialStore = inject(testimonialSiteStore);
  newsStore = inject(newsStore);
  branchStore = inject(branchSiteStore);
  public settingService = inject(PublicSettingStore);
  private sanitizer = inject(DomSanitizer);

  currentSlide = 0;
  slideInterval: any;

  @ViewChild('testimonialGrid') testimonialGrid!: ElementRef<HTMLDivElement>;
  @ViewChild('newsGrid') newsGrid!: ElementRef<HTMLDivElement>;

  scrollTestimonials(direction: 'left' | 'right'): void {
    if (this.testimonialGrid) {
      const container = this.testimonialGrid.nativeElement;
      const scrollAmount = container.clientWidth * 0.8; // Scroll by 80% of container width
      
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  }

  scrollNews(direction: 'left' | 'right'): void {
    if (this.newsGrid) {
      const container = this.newsGrid.nativeElement;
      const scrollAmount = container.clientWidth * 0.8; // Scroll by 80% of container width
      
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  }

  // ✅ FIX 1: Use computed() instead of effect() + signal().
  //    computed() derives the value reactively — Angular knows exactly
  //    when it changes and never causes NG0100.
  carouselSlides = computed<ISiteCarousel[]>(() => {
    if (!this.store.isSuccess) return [];

    const sorted = [...this.store.list()].sort(
      (a, b) => a.displayOrder - b.displayOrder
    );
    const limit = this.settingService.maxCarousel();
    return limit > 0 ? sorted.slice(0, limit) : sorted;
  });

  testimonials = computed<ITestimonials[]>(() => {
    if (!this.testimonialStore.isSuccess()) return []
    return this.testimonialStore.list();
  });


  news = computed<NewsAnnouncement[]>(() => {
    if (!this.newsStore.isSuccess()) return []
    const limit = this.settingService.maxNews();
    return this.newsStore.list().slice(0, limit);
  })

  branches = computed<Branch[]>(() => {
    if (!this.branchStore.isSuccess()) return [];
    return this.branchStore.list();
  });

  ngOnInit(): void {
    this.store.getAll({
      endpoint: API.ADMIN.SITE_CONFIGURATION.CAROUSEL_LIST,
    });
    this.testimonialStore.getAll({
      endpoint: API.ADMIN.SITE_CONFIGURATION.TESTIMONIAL_LIST
    });
    this.newsStore.getAll({
      endpoint: API.ADMIN.SITE_CONFIGURATION.NEWS_LIST
    });
    this.branchStore.getAll({
      endpoint: API.ADMIN.SITE_CONFIGURATION.BRANCH_LIST
    });
    this.startCarousel();
  }

  ngOnDestroy(): void {
    this.stopCarousel();
  }

  startCarousel(): void {
    this.slideInterval = setInterval(() => this.nextSlide(), 5000);
  }

  stopCarousel(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  nextSlide(): void {
    const total = this.carouselSlides().length; // ✅ FIX 2: signal() is a function — must invoke it
    if (total === 0) return;
    this.currentSlide = (this.currentSlide + 1) % total;
  }

  setSlide(index: number): void {
    this.currentSlide = index;
    this.stopCarousel();
    this.startCarousel();
  }


  constructor() { }

  openEnquiryModal() {
    // this.appComponent.openEnquiryModal();
  }
  getSafeImageSrc(base64: string): SafeUrl {
    const src = this.getImageSrc(base64);
    return this.sanitizer.bypassSecurityTrustUrl(src);
  }
  getImageSrc(base64: string): string {
    if (!base64) return 'assets/images/placeholder.png'; // fallback

    // If API already returns full data URI — use as-is
    if (base64.startsWith('data:')) return base64;

    // If API returns raw base64 — prefix it
    return `data:image/jpeg;base64,${base64}`;
  }

  isExternalLink(url: string): boolean {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.startsWith('http://') || 
           lowerUrl.startsWith('https://') || 
           lowerUrl.startsWith('www.') ||
           /^([a-z0-9-]+\.)+(com|org|net|edu|gov|io|in|co|us|uk)(\/.*)?$/i.test(url);
  }

  getExternalLink(url: string): string {
    if (!url) return '#';
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    return `https://${url}`;
  }
  public starConfig = (value: number): StarRatingConfig => {
    return {
      initialValue: value,
      readonly: true,
      allowHalf: true,
      size: 14,
      gap: 2,
      filledColor: '#EF9F27',
    };
  }
  private readonly fb = inject(FormBuilder);

  protected formGroup: FormGroup<any> = this.fb.group({
    rating: [5, [Validators.required]],
  });;
}