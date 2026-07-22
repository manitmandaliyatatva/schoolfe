import { ChangeDetectorRef, Component, computed, effect, inject, OnDestroy, OnInit, signal, TemplateRef, ViewChild } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { distinctUntilChanged } from 'rxjs';
import { FormatTimeTo12Hour } from '../../../../../core/helpers/datetime.helper';
import { CommonHelperService } from '../../../../../core/services/common-helper.service';
import { CommonDropdownStore } from '../../../../../core/store/common-dropdown.store';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { GRID_TEMPLATE_KEYS } from '../../../../../shared/components/common-data-grid/constants/grid.constant';
import { CommonDataGrid, CommonDataGridColumnConfig } from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { CommonDropdownConfig } from '../../../../../shared/components/common-dropdown/model/common-dropdown.model';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { CommonButtonConfig } from '../../../../../shared/components/button/model/button.model';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { CommonTimetableCardComponent } from '../../../../../shared/components/common-timetable-card/common-timetable-card.component';
import { TimetableCardData } from '../../../../../shared/components/common-timetable-card/model/common-timetable-card.model';
import { GenericDialogService } from '../../../../../shared/services/generic-dialog.service';
import { API } from '../../../../../shared/constants/api-url';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { getDropdownConfig } from '../../../../../shared/functions/config-function';
import { ITextValueOption } from '../../../../../shared/models/common.model';
import { TimetableDialog } from '../../shared/dialog/timetable-dialog';
import { buildTimetableGridRows, createTimetableListRequestBody, generateTimeTableSlots, getTimetableGridColumns } from '../../shared/timetable-shared.util';
import { DropdownTeacher, TeacherTimetable, TeacherTimetableGridRow, teacherTimetableStore } from '../models/teacher-timetable.model';
import { timeslotStore } from '../../time-slot/models/timeslot.model';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { ButtonType } from '../../../../../core/models/common.model';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';
import { HolidayHelperService } from '../../../../../core/services/holiday-helper.service';
import FileHelper from '../../../../../shared/helpers/file.helper';
import { Base64Document } from '../../../../../shared/models/document.model';

import { CommonModule } from '@angular/common';

@UntilDestroy()
@Component({
  selector: 'app-teacher-timetable',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CommonDataGridComponent,
    DynamicFormComponent,
    CommonTimetableCardComponent,
    ButtonComponent,
  ],
  providers: [teacherTimetableStore, timeslotStore],
  templateUrl: './teacher-timetable.html',
  styleUrl: './teacher-timetable.scss',
})
export class TeacherTimetableComponent implements OnInit, OnDestroy {
  private static readonly TEACHER_DROPDOWN_KEY = 'teacherTimetableFilterTeacher';

  @ViewChild('timetableCardCell', { static: true }) timetableCardCell!: TemplateRef<unknown>;
  @ViewChild('breakRowTemplate', { static: true }) breakRowTemplate!: TemplateRef<unknown>;
  @ViewChild('timeslotcol', { static: true }) timeslotcol!: TemplateRef<unknown>;

  readonly timetableStore = inject(teacherTimetableStore);
  readonly timeSlotStore = inject(timeslotStore);
  readonly commonHelperService = inject(CommonHelperService);
  readonly dropdownStore = inject(CommonDropdownStore);
  private readonly genericDialog = inject(GenericDialogService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly holidayHelperService = inject(HolidayHelperService);

  readonly teacherDropdownList = this.dropdownStore.getList(TeacherTimetableComponent.TEACHER_DROPDOWN_KEY);
  readonly permission = computed(() => this.commonHelperService.getPermissionByPage());
  readonly isMyTimetable = computed(() => !!this.route.snapshot.data['myTimetable']);

  readonly screenTitle = signal(`${TITLES.ADMIN.TEACHER_TIMETABLE}`);
  readonly teacherDropdownConfig = signal<CommonDropdownConfig>(
    getDropdownConfig('teacherId', SYSTEM_CONST.LABELS.USER.TEACHER, [])
  );
  private readonly isDeleteRequested = signal<boolean>(false);
  private readonly lastLoadedTeacherId = signal<string | null>(null);

  readonly filterForm = this.fb.group({
    teacherId: this.fb.control<string | null>(null),
  });

  filterFormControls = computed<DynamicForm>(() => ({
    formSection: [
      {
        controls: [
          {
            control: this.teacherDropdownConfig(),
            type: DynamicFormControlType.DropDown,
            class: 'col-md-4'
          },
        ],
      },
    ],
  }));

  teacherTimetableGridConfig!: CommonDataGrid<TeacherTimetableGridRow>;

  readonly refreshButtonConfig = computed<CommonButtonConfig>(() => (CommonHelper.getRefreshButtonConfig(
    () => this.loadTimetableList(this.filterForm.controls.teacherId.value, true)
  )));

  readonly downloadButtonConfig = computed<CommonButtonConfig>(() => ({
    variant: 'flat',
    color: 'primary',
    icon: 'download',
    tooltipText: SYSTEM_CONST.ACTION_BUTTONS.DOWNLOAD,
    visibleCallback: () => this.permission().canDownload,
    callback: () => this.downloadPdf(),
    cssClasses: ['square-icon-btn']
  }));

  constructor() {
    effect(() => {
      this.timetableStore.list();
      this.timeSlotStore.list();
      this.rebuildGridRows();
    });

    effect(() => {
      this.holidayHelperService.excludeWeekdays();
      this.teacherTimetableGridConfig = {
        ...this.teacherTimetableGridConfig,
        columns: this.buildColumns(),
        features: {
          ...this.teacherTimetableGridConfig.features,
          mergeColumnSpan: this.buildColumns().length
        }
      };
      this.cdr.detectChanges();
    });

    effect(() => {
      if (!this.isDeleteRequested() || !this.timetableStore.isSuccess()) return;
      this.isDeleteRequested.set(false);
      this.loadTimetableList(this.filterForm.controls.teacherId.value, true);
    });

    effect(() => {
      const options = this.teacherDropdownList();
      this.teacherDropdownConfig.update((config) => ({
        ...config,
        data: options,
      }));

      if (this.isMyTimetable()) return;
      if (options.length > 0 && CommonHelper.isEmpty(this.filterForm.controls.teacherId.value)) {
        const defaultTeacherId = String(options[0].value);
        this.filterForm.controls.teacherId.patchValue(defaultTeacherId, { emitEvent: false });
        this.loadTimetableList(defaultTeacherId, true);
      }
    });
  }

  ngOnInit(): void {
    this.teacherTimetableGridConfig = this.buildGridConfig();
    this.loadTimeSlotList();
    if (this.isMyTimetable()) {
      this.screenTitle.set(TITLES.TEACHER.MY_TIMETABLE);
      this.loadTimetableList(null, true);
      return;
    }

    this.loadTeacherDropdown();

    this.filterForm.controls.teacherId.valueChanges.pipe(
      distinctUntilChanged(),
    ).subscribe((teacherId) => {
      this.loadTimetableList(teacherId);
    });
  }

  onEditClick = (row: TimetableCardData | null): void => {
    if (CommonHelper.isEmptyGuid(row?.timeTableId)) return;
    this.openDialog(row!.timeTableId);
  };

  onAddClick = (row: TimetableCardData | null): void => {
    if (!row || !row.isNoSchedule) return;
    this.openDialog(undefined, row);
  };

  onDeleteClick = (row: TimetableCardData | null): void => {
    if (CommonHelper.isEmpty(row?.timeTableId)) return;
    const label = row.classSectionName || `${row.startTime || ''}-${row.endTime || ''}` || 'selected row';
    this.commonHelperService.confirmAndCallApi({
      title: this.commonHelperService.handleButtonText(TITLES.ADMIN.TEACHER_TIMETABLE, ButtonType.Delete),
      message: SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(label),
      confirmText: 'Delete',
      request: () => {
        this.isDeleteRequested.set(true);
        this.timetableStore.remove({
          endpoint: API.ADMIN.CONFIGURATION.TIMETABLE.DELETE,
          params: { timeTableId: row.timeTableId },
        });
      },
    });
  };

  getCellRow = (row: TeacherTimetableGridRow, dayField: keyof TeacherTimetableGridRow, rowIndex = 0): TimetableCardData | null => {
    if (dayField === 'sunday' && this.holidayHelperService.excludeWeekdays().includes(0)) {
      if (rowIndex > 0) return null;
      return {
        timeTableId: null,
        isHoliday: true,
      };
    }

    const value = row[dayField];
    if (this.isTimetableItem(value)) {
      if (CommonHelper.isEmpty(value.timeTableId) && !value.isBreak) {
        return {
          ...value,
          isNoSchedule: true,
        };
      }
      return value;
    }

    return {
      timeTableId: null,
      isNoSchedule: true,
    };
  };

  private openDialog = (timeTableId?: string | null, preselectedSlot?: TimetableCardData): void => {
    this.genericDialog.open({
      width: '800px',
      title: !CommonHelper.isEmptyGuid(timeTableId) ? `Edit ${TITLES.ADMIN.TEACHER_TIMETABLE}` : `Add ${TITLES.ADMIN.TEACHER_TIMETABLE}`,
      component: TimetableDialog,
      data: {
        timeTableId: timeTableId ?? EMPTY_GUID,
        selectedTeacherId: this.filterForm.controls.teacherId.value,
        selectedTimeSlotId: preselectedSlot?.timeSlotId ?? null,
        selectedWeekDayId: preselectedSlot?.weekDayId ?? null,
        source: 'teacher'
      },
    }).afterClosed().subscribe((saved) => {
      if (!saved) return;
      this.loadTimetableList(this.filterForm.controls.teacherId.value, true);
    });
  };

  private downloadPdf = (): void => {
    let params;
    if (!this.isMyTimetable()) {
      const teacherId = this.filterForm.controls.teacherId.value;
      if (teacherId) {
        params = { teacherId };
      }
    }

    this.timetableStore.getWithResult<Base64Document>({
      endpoint: API.ADMIN.CONFIGURATION.TIMETABLE.DOWNLOAD,
      params
    }).pipe(untilDestroyed(this)).subscribe(data => {
      if (data) {
        const normalizedBase64 = FileHelper.normalizeBase64(data.base64);
        const fileName = data.fileName || `Timetable.pdf`;
        const contentType = FileHelper.resolveContentType(data.contentType, fileName, data.base64);
        if (normalizedBase64) {
          FileHelper.downloadBase64(normalizedBase64, fileName, contentType);
        }
      }
    });
  };

  private buildGridConfig = (): CommonDataGrid<TeacherTimetableGridRow> => {
    return {
      id: 'admin-teacher-timetable-grid',
      primaryKey: 'rowId',
      data: [],
      features: {
        showPagination: false,
        showSearch: false,
        isMergeColumn: (row) => !!row.monday?.isBreak || !!row.tuesday?.isBreak || !!row.wednesday?.isBreak || !!row.thursday?.isBreak || !!row.friday?.isBreak || !!row.saturday?.isBreak || !!row.sunday?.isBreak,
        mergeColumnSpan: this.buildColumns().length,
      },
      columns: this.buildColumns(),
      customRenderTemplateCallback: (name) => {
        if (name === GRID_TEMPLATE_KEYS.FullWidthRow) return this.breakRowTemplate;
        return null;
      },
    };
  };

  private buildColumns = (): CommonDataGridColumnConfig<TeacherTimetableGridRow>[] => {
    return getTimetableGridColumns<TeacherTimetableGridRow>(
      this.holidayHelperService.excludeWeekdays(),
      this.timeslotcol,
      this.timetableCardCell
    );
  };

  private loadTeacherDropdown = (): void => {
    this.dropdownStore.getDropdown({
      key: TeacherTimetableComponent.TEACHER_DROPDOWN_KEY,
      endpoint: API.ADMIN.USER.TEACHER.DROPDOWN,
    });
  };

  private loadTimetableList = (selectedTeacherId?: string | null, force = false): void => {
    const normalizedTeacherId = selectedTeacherId ?? null;
    if (!force && normalizedTeacherId === this.lastLoadedTeacherId()) return;
    const requestBody = createTimetableListRequestBody('teacherid', normalizedTeacherId);

    this.timetableStore.getAll({
      endpoint: API.ADMIN.CONFIGURATION.TIMETABLE.LIST,
      body: requestBody as any,
    });
    this.lastLoadedTeacherId.set(normalizedTeacherId);
  };

  private loadTimeSlotList = (): void => {
    this.timeSlotStore.getAll({
      endpoint: API.ADMIN.CONFIGURATION.TIMESLOT.LIST,
      body: {
        pageIndex: 0,
        pageSize: -1,
        generalSearch: '',
        defaultSortingColumn: '',
        sortOrder: 'asc',
        columns: [],
      } as any,
    });
  };

  private refreshGridData = (rows: TeacherTimetableGridRow[]): void => {
    this.teacherTimetableGridConfig = {
      ...this.teacherTimetableGridConfig,
      data: rows,
    };
    this.cdr.detectChanges();
  };

  private rebuildGridRows = (): void => {
    const rows = this.computeGridRows(this.timetableStore.list());
    this.refreshGridData(rows);
  };

  private computeGridRows = (
    records: TeacherTimetable[],
  ): TeacherTimetableGridRow[] => {
    const generatedSlots = generateTimeTableSlots<TeacherTimetable>({
      timeSlots: this.timeSlotStore.list(),
      timetableData: records,
    });
    return buildTimetableGridRows<TeacherTimetable>(generatedSlots);
  };

  private isTimetableItem = (value: unknown): value is TeacherTimetable =>
    !!value && typeof value === 'object' && 'timeTableId' in (value as Record<string, unknown>);

  getBreakTimeRange = (row: TeacherTimetableGridRow): string => {
    const item = this.getFirstItem(row);
    if (!item?.startTime || !item?.endTime) return '';
    return `${FormatTimeTo12Hour(item.startTime)} - ${FormatTimeTo12Hour(item.endTime)}`;
  };

  getRowTimeRange = (row: TeacherTimetableGridRow): string => {
    const item = this.getFirstItem(row);
    if (!item?.startTime || !item?.endTime) return '';
    return `${FormatTimeTo12Hour(item.startTime)} ${FormatTimeTo12Hour(item.endTime)}`;
  }
  private getFirstItem = (row: TeacherTimetableGridRow): TeacherTimetable | null => {
    const fields = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
    for (const f of fields) {
      const v = row[f];
      if (this.isTimetableItem(v)) return v;
    }
    return null;
  };


  ngOnDestroy(): void {
    this.timetableStore.resetState();
    this.timeSlotStore.resetState();
  }
}
