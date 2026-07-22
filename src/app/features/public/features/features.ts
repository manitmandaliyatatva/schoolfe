import { Component, inject, OnInit } from '@angular/core';
import { facilityStore } from '../../admin/public-site/facility/models/facility.model';
import { CommonModule } from '@angular/common';
import { API } from '../../../shared/constants/api-url';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-features',
  imports: [CommonModule],
  templateUrl: './features.html',
  providers: [facilityStore],
  styleUrl: './features.scss',
})
export class Features implements OnInit {
  private sanitizer = inject(DomSanitizer);
  ngOnInit(): void {
    this.featureStore.getAll({
      endpoint: API.ADMIN.SITE_CONFIGURATION.FACILITY_LIST
    })
  }
  featureStore = inject(facilityStore);

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
}
