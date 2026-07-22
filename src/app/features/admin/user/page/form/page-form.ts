import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { CommonModule } from '@angular/common';
import { PageTabFormComponent } from './page-tab-form/page-tab-form';
import { pageStore } from '../models/page.model';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { API } from '../../../../../shared/constants/api-url';

@Component({
  selector: 'app-page-form',
  standalone: true,
  imports: [CommonModule, MatTabsModule, PageTabFormComponent],
  providers: [pageStore],
  templateUrl: './page-form.html',
})
export class PageForm implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(pageStore);

  readonly isEditMode = signal(false);
  readonly isAction = signal<boolean | null>(null);
  readonly selectedIndex = signal(0);

  ngOnInit(): void {
    const pageId = this.route.snapshot.paramMap.get('pageId');
    if (!CommonHelper.isEmpty(pageId)) {
      this.isEditMode.set(true);
      this.store.getWithResult({ endpoint: API.ADMIN.USER.PAGES.GET, params: { pageId: pageId! } }).subscribe({
        next: (res) => {
          if (res) {
            const isAct = res.isAction;
            this.isAction.set(isAct);
            this.selectedIndex.set(isAct ? 1 : 0);
          }
        }
      });
    } else {
      this.isEditMode.set(false);
      this.isAction.set(null);
      const isActParam = this.route.snapshot.queryParamMap.get('isAction');
      if (isActParam === 'true') {
        this.selectedIndex.set(1);
      } else {
        this.selectedIndex.set(0);
      }
    }
  }
}
