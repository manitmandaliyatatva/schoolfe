import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { NewsAnnouncement, newsStore } from '../../admin/public-site/news-announcement/models/news-anouncement.model';
import { API } from '../../../shared/constants/api-url';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './news-detail.html',
  styleUrl: './news-detail.scss',
  providers: [newsStore]
})
export class NewsDetail implements OnInit {
  private sanitizer = inject(DomSanitizer);
  article = computed<NewsAnnouncement>(() => {
    if (!this.newsStore.isSuccess()) return null;
    console.log(this.newsStore.data())
    return this.newsStore.data();
  });
  newsStore = inject(newsStore);

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('newsId');
      this.newsStore.getById({
        endpoint: API.ADMIN.SITE_CONFIGURATION.NEWS_BYID,
        params: { 'newsId': id },
      });
      window.scrollTo(0, 0);
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
