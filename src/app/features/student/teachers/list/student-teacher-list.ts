import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { HttpService } from '../../../../core/services/http.service';
import { Teacher } from '../../../admin/user/teacher/models/teacher.model';
import { API } from '../../../../shared/constants/api-url';
import { SafeImageComponent } from '../../../../shared/components/safe-image/safe-image.component';
import { buildGridListRequest } from '../../../../shared/helpers/grid.helper';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { InfiniteScrollDirective } from '../../../../shared/directives/infinite-scroll.directive';
import { DEFAULT_GRID_PAGE_INDEX, DEFAULT_GRID_PAGE_SIZE } from '../../../../shared/components/common-data-grid/constants/grid.constant';
import { CommonHelperService } from '../../../../core/services/common-helper.service';

interface TeacherCardData extends Teacher {
  extractedSubject: string;
  extractedClass: string;
  initials: string;
}

@Component({
  selector: 'app-student-teacher-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    SafeImageComponent,
    InfiniteScrollDirective,
  ],
  templateUrl: './student-teacher-list.html',
  styleUrl: './student-teacher-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentTeacherList implements OnInit {
  private httpService = inject(HttpService);
  private commonHelperService = inject(CommonHelperService);

  readonly permission = computed(() => this.commonHelperService.getPermissionByPage());

  teachers = signal<TeacherCardData[]>([]);
  searchControl = new FormControl('');

  private pageIndex = DEFAULT_GRID_PAGE_INDEX;
  private pageSize = DEFAULT_GRID_PAGE_SIZE;
  hasMore = true;
  protected isFetching = false;

  ngOnInit() {
    if (!this.permission().canList) return;

    this.searchControl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.resetAndLoad();
    });

    this.loadMore();
  }

  resetAndLoad() {
    this.pageIndex = 0;
    this.hasMore = true;
    this.isFetching = false;
    this.teachers.set([]);
    this.loadMore();
  }

  loadMore() {
    if (!this.permission().canList) return;
    if (!this.hasMore || this.isFetching) return;
    this.isFetching = true;

    const filter: any = {
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      defaultSortingColumn: '',
      sortOrder: '',
      generalSearch: this.searchControl.value || ''
    };

    const payload = buildGridListRequest<Teacher>(filter);

    this.httpService.post(API.ADMIN.USER.TEACHER.LIST, payload).subscribe({
      next: (res: any) => {
        const data: Teacher[] = res.data?.data || res.data || [];
        
        const mappedData: TeacherCardData[] = data.map(t => ({
          ...t,
          extractedSubject: this.extractSubject(t.classSubjectName),
          extractedClass: this.extractClass(t.classSubjectName),
          initials: this.getInitials(t.fullName)
        }));

        if (mappedData.length > 0) {
          this.teachers.update(prev => [...prev, ...mappedData]);
          this.hasMore = mappedData.length === this.pageSize;
        } else {
          this.hasMore = false;
        }

        this.isFetching = false;
      },
      error: () => {
        this.isFetching = false;
        this.hasMore = false;
      }
    });

    this.pageIndex++;
  }

  private extractSubject(classSub: string | undefined): string {
    if (!classSub) return '-';
    const parts = classSub.split('-');
    if (parts.length > 2) {
      return parts[parts.length - 1].trim();
    }
    return parts[parts.length - 1].trim();
  }

  private extractClass(classSub: string | undefined): string {
    if (!classSub) return '-';
    const parts = classSub.split('-');
    if (parts.length > 2) {
      return parts.slice(0, parts.length - 1).join('-').trim();
    }
    if (parts.length === 2) {
      return parts[0].trim();
    }
    return '-';
  }

  private getInitials(name: string | undefined): string {
    if (!name) return 'T';
    const parts = name.trim().split(' ').filter(p => p.length > 0);
    if (parts.length === 0) return 'T';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
