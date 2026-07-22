import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { SafeImageComponent } from '../../../../shared/components/safe-image/safe-image.component';
import { HttpService } from '../../../../core/services/http.service';
import { IApiResponse, IDataTableResponse } from '../../../../core/models/request.model';
import { SYSTEM_CONST } from '../../../../core/constants/system.constant';
import CommonHelper from '../../../../core/helpers/common-helper';
import { AuthStore } from '../../../../core/store/auth.store';
import { GridBase } from '../../../../shared/components/grid-base/grid-base';
import { API } from '../../../../shared/constants/api-url';
import { TITLES } from '../../../../shared/constants/title.constant';
import { CommonDataGridColumnConfig } from '../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { buildGridListRequest } from '../../../../shared/helpers/grid.helper';
import { Student, studentStore } from '../../../admin/user/student/models/student.model';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CommonButtonConfig } from '../../../../shared/components/button/model/button.model';
import { SearchInputComponent } from '../../../../shared/components/search-input/search-input.component';
import { InfiniteScrollDirective } from '../../../../shared/directives/infinite-scroll.directive';
import { DEFAULT_GRID_PAGE_INDEX, DEFAULT_GRID_PAGE_SIZE } from '../../../../shared/components/common-data-grid/constants/grid.constant';
import { CommonDateFormat } from '../../../../core/constants/date-format.constant';

@Component({
  selector: 'app-classmates',
  standalone: true,
  imports: [
    CommonModule,
    SafeImageComponent,
    MatIconModule,
    ReactiveFormsModule,
    ButtonComponent,
    SearchInputComponent,
    InfiniteScrollDirective,
  ],
  providers: [studentStore],
  templateUrl: './classmates.html',
  styleUrl: './classmates.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassmatesComponent extends GridBase<Student> implements OnInit, OnDestroy {
  protected readonly authStore = inject(AuthStore);
  protected override store = inject(studentStore);
  protected readonly http = inject(HttpService);

  readonly classmates = signal<Student[]>([]);
  readonly isLoading = signal(false);
  readonly refreshButtonConfig = computed<CommonButtonConfig>(() => (
    CommonHelper.getRefreshButtonConfig(() => this.resetAndLoad())
  ));

  searchControl = new FormControl('');

  private pageIndex = DEFAULT_GRID_PAGE_INDEX;
  private pageSize = DEFAULT_GRID_PAGE_SIZE;
  protected hasMore = true;
  protected isFetching = false;
  protected readonly commonDateFormat = CommonDateFormat;

  protected override apiEndpoint = API.ADMIN.USER.STUDENT.List;
  protected override deleteEndpoint = '';
  protected override primaryKey: keyof Student = 'studentId';
  protected override get pageTitle(): string {
    return TITLES.STUDENT.CLASSMATES;
  }
  protected override get routeBasePath(): string {
    return 'student/classmates';
  }
  protected override deleteConfirmTitle = '';
  protected override deleteConfirmMessage = () => '';

  override ngOnInit(): void {
    super.ngOnInit();
    this.searchControl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.resetAndLoad();
    });
    this.loadMore();
  }


  protected override buildColumns = (): CommonDataGridColumnConfig<Student>[] => [];

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  resetAndLoad(): void {
    this.pageIndex = 0;
    this.hasMore = true;
    this.isFetching = false;
    this.classmates.set([]);
    this.loadMore();
  }

  loadMore(): void {
    if (!this.permission().canList) return;
    if (!this.hasMore || this.isFetching) return;
    this.isFetching = true;
    this.isLoading.set(true);

    const filter = {
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      defaultSortingColumn: 'fullName',
      sortOrder: 'asc' as const,
      generalSearch: this.searchControl.value || '',
      filterData: null,
    };

    const req = buildGridListRequest(filter);

    this.http.post<IApiResponse<IDataTableResponse<Student>>, any>(
      this.apiEndpoint, req
    ).subscribe({
      next: (response) => {
        const tableData = response?.data;
        const list = tableData?.data ?? [];

        if (list.length > 0) {
          this.classmates.update(prev => [...prev, ...list]);
          this.hasMore = list.length === this.pageSize;
        } else {
          this.hasMore = false;
        }

        this.isFetching = false;
        this.isLoading.set(false);
      },
      error: () => {
        this.isFetching = false;
        this.hasMore = false;
        this.isLoading.set(false);
      }
    });

    this.pageIndex++;
  }
}
