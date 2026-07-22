import { CommonModule } from '@angular/common';
import { Component, computed, effect, HostListener, inject, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { contactStore } from '../../../features/admin/public-site/contactus/models/contactus.model';
import { IMetaInformation, metaStore } from '../../../features/admin/public-site/meta-information/models/meta-information.model';
import { API } from '../../../shared/constants/api-url';
import { EMPTY_GUID } from '../../../shared/constants/app.constants';
import { buildGridListRequest } from '../../../shared/helpers/grid.helper';
import { PublicSettingStore } from '../../store/public-setting.store';

import { PublicLoaderService } from '../../../core/services/public-loader.service';
import { PUBLIC_SITE_CONST } from '../../../features/public/shared/public.model';
import { ToastrHelperService } from '../../services/toster-helper.service';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './public-layout.html',
  styleUrls: ['./public-layout.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [contactStore]
})
export class PublicLayoutComponent implements OnInit {
  protected readonly title = signal('Internationalization');
  private toaster = inject(ToastrHelperService);

  metaStore = inject(metaStore);
  contactStore = inject(contactStore);
  public settingStore = inject(PublicSettingStore);
  public publicLoader = inject(PublicLoaderService);
  fb = inject(FormBuilder);
  publicConst = signal(PUBLIC_SITE_CONST);

  contactData = computed<IMetaInformation | null>(() => {
    return this.metaStore.list()?.[0] ?? null;
  });

  isEnquiryModalOpen = signal(false);
  isMobileMenuOpen = signal(false);
  showScrollToTop = signal(false);

  //Form Config
  //fullNameCOnfig = signal<CommonTextboxConfig>(getTextboxConfig(this.publicConst().FULL_NAME, 'fullName', null, InputType.text, 'outline',))
  //emailConfig = signal<CommonTextboxConfig>(getTextboxConfig(this.publicConst().EMAIL, 'email', null, InputType.text, 'outline'))

  // Floating Contact Form
  isContactModalOpen = signal(false);
  contactForm: FormGroup = this.fb.group({
    id: [EMPTY_GUID],
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    message: ['', Validators.required],
  });

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showScrollToTop.update(() => window.scrollY > 300);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.isMobileMenuOpen.update(() => false);
      setTimeout(() => this.initScrollAnimations(), 100);
    });

    effect(() => {
      if (this.contactStore.isSuccess()) {
        this.contactForm.reset({ id: EMPTY_GUID });
        this.isContactModalOpen.update(() => false);
        this.toaster.showSuccessMessage(this.publicConst().CONFIRMATION_CONTACT)

      }
    });
  }

  ngOnInit(): void {
    this.metaStore.getAll({
      endpoint: API.ADMIN.SITE_CONFIGURATION.META_INFORMATION_LIST,
      body: buildGridListRequest(null),
    });
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(() => !this.isMobileMenuOpen());
  }

  ngAfterViewInit() {
    this.initScrollAnimations();
  }

  initScrollAnimations() {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.animate-fade-in-up:not(.is-visible)').forEach(el => {
      observer.observe(el);
    });
  }

  openEnquiryModal() {
    this.isEnquiryModalOpen.update(() => true);
  }

  closeEnquiryModal() {
    this.isEnquiryModalOpen.update(() => false);
  }

  toggleContactModal() {
    this.isContactModalOpen.update(() => !this.isContactModalOpen());
  }

  submitContactForm() {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.contactStore.create({
      endpoint: API.ADMIN.SITE_CONFIGURATION.CONTACTUS.ADDUPDATE,
      body: this.contactForm.value,
    });
  }
}
