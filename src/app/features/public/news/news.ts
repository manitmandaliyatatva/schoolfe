import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { API } from '../../../shared/constants/api-url';
import { NewsAnnouncement, newsStore } from '../../admin/public-site/news-announcement/models/news-anouncement.model';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { PublicSettingStore } from '../../../core/store/public-setting.store';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './news.html',
  styleUrl: './news.scss',
  providers: [newsStore]
})
export class News implements OnInit {
  private sanitizer = inject(DomSanitizer);
  newsStore = inject(newsStore);
  public settingService = inject(PublicSettingStore);

  newsList = computed<NewsAnnouncement[]>(() => {
    if (!this.newsStore.isSuccess()) return []
    return this.newsStore.list();
  });

  ngOnInit() {
    this.newsStore.getAll({
      endpoint: API.ADMIN.SITE_CONFIGURATION.NEWS_LIST
    });
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
}
