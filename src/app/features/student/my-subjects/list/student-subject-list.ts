import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import CommonHelper from '../../../../core/helpers/common-helper';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CommonButtonConfig } from '../../../../shared/components/button/model/button.model';
import { CommonDataGridColumnConfig } from '../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { GridBase } from '../../../../shared/components/grid-base/grid-base';
import { SearchInputComponent } from '../../../../shared/components/search-input/search-input.component';
import { API } from '../../../../shared/constants/api-url';
import { TITLES } from '../../../../shared/constants/title.constant';
import { buildGridListRequest } from '../../../../shared/helpers/grid.helper';
import { SubjectGridRow } from '../../../admin/configuration/subject/models/subject.model';
import { SubjectStore } from '../../../admin/configuration/subject/stores/subject.store';

@Component({
  selector: 'app-student-subject-list',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    ReactiveFormsModule,
    ButtonComponent,
    SearchInputComponent
  ],
  providers: [SubjectStore],
  templateUrl: './student-subject-list.html',
  styleUrl: './student-subject-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentSubjectList extends GridBase<SubjectGridRow> implements OnInit, OnDestroy {
  protected override store = inject(SubjectStore);

  readonly refreshButtonConfig = computed<CommonButtonConfig>(() => (
    CommonHelper.getRefreshButtonConfig(() => this.loadSubjects())
  ));

  searchControl = new FormControl('');
  private searchSub!: Subscription;

  protected override apiEndpoint = API.CLASS.GET_SUBJECT_LIST;
  protected override deleteEndpoint = '';
  protected override primaryKey: keyof SubjectGridRow = 'subjectId';
  protected override pageTitle = `${TITLES.SUBJECT}`;
  protected override get routeBasePath(): string {
    return `student/configuration/subjects`;
  }
  protected override deleteConfirmTitle = '';
  protected override deleteConfirmMessage = () => '';

  override ngOnInit(): void {
    super.ngOnInit();

    this.searchSub = this.searchControl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.loadSubjects();
    });

    this.loadSubjects();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    if (this.searchSub) {
      this.searchSub.unsubscribe();
    }
  }

  loadSubjects(): void {
    const filter = {
      pageIndex: 0,
      pageSize: -1, // Retrieve all records
      defaultSortingColumn: 'subjectName',
      sortOrder: 'asc' as const,
      generalSearch: this.searchControl.value || '',
      filterData: null,
    };

    const req = buildGridListRequest(filter);

    this.store.getAll({
      endpoint: this.apiEndpoint,
      body: req
    });
  }

  protected override buildColumns(): CommonDataGridColumnConfig<SubjectGridRow>[] {
    return [];
  }
}
