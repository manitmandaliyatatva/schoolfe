import { ChangeDetectorRef, Component, computed, effect, inject, OnDestroy, OnInit, signal, TemplateRef, ViewChild } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
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
import { buildTimetableGridRows, createTimetableListRequestBody, generateTimeTableSlots, getTimetableGridColumns, getSubjectIcon, getThemeColor, WEEKDAY_TABS } from '../../shared/timetable-shared.util';
import { ClassroomTimetable, ClassroomTimetableGridRow, classroomTimetableStore, DropdownClassroomFilter } from '../models/classroom-timetable.model';
import { timeslotStore } from '../../time-slot/models/timeslot.model';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { ButtonType } from '../../../../../core/models/common.model';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { HolidayHelperService } from '../../../../../core/services/holiday-helper.service';
import { MatIconModule } from '@angular/material/icon';
import FileHelper from '../../../../../shared/helpers/file.helper';
import { Base64Document } from '../../../../../shared/models/document.model';

import { CommonModule } from '@angular/common';

@UntilDestroy()
@Component({
  selector: 'app-classroom-timetable',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CommonDataGridComponent,
    DynamicFormComponent,
    CommonTimetableCardComponent,
    ButtonComponent,
    MatIconModule,
  ],
  providers: [classroomTimetableStore, timeslotStore],
  templateUrl: './classroom-timetable.html',
  styleUrl: './classroom-timetable.scss',
})
export class ClassroomTimetableComponent implements OnInit, OnDestroy {
  private static readonly CLASSROOM_DROPDOWN_KEY = 'classroomTimetableFilterClassroom';

  @ViewChild('timetableCardCell', { static: true }) timetableCardCell!: TemplateRef<unknown>;
  @ViewChild('breakRowTemplate', { static: true }) breakRowTemplate!: TemplateRef<unknown>;
  @ViewChild('timeslotcol', { static: true }) timeslotcol!: TemplateRef<unknown>;

  readonly timetableStore = inject(classroomTimetableStore);
  readonly timeSlotStore = inject(timeslotStore);
  readonly commonHelperService = inject(CommonHelperService);
  readonly dropdownStore = inject(CommonDropdownStore);
  private readonly genericDialog = inject(GenericDialogService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly holidayHelperService = inject(HolidayHelperService);

  readonly classroomDropdownList = this.dropdownStore.getList(ClassroomTimetableComponent.CLASSROOM_DROPDOWN_KEY);
  readonly permission = computed(() => this.commonHelperService.getPermissionByPage());
  readonly isMyTimetable = computed(() => !!this.route.snapshot.data['myTimetable']);

  private getDayKey(dayIndex: number): keyof ClassroomTimetableGridRow {
    const map: Record<number, keyof ClassroomTimetableGridRow> = {
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
      0: 'sunday',
    };
    return map[dayIndex] ?? 'monday';
  }

  readonly selectedDay = signal<keyof ClassroomTimetableGridRow>(
    this.getDayKey(new Date().getDay())
  );

  readonly activeWeekDays = WEEKDAY_TABS;

  getSubjectIcon = getSubjectIcon;
  getThemeColor = getThemeColor;

  formatTime = (time: string | undefined): string => {
    return time ? FormatTimeTo12Hour(time) : '';
  };

  readonly screenTitle = signal(`${TITLES.ADMIN.CLASSROOM_TIMETABLE}`);
  readonly classroomDropdownConfig = signal<CommonDropdownConfig>(
    getDropdownConfig('classSectionId', SYSTEM_CONST.LABELS.COMMON.CLASSROOM, [])
  );
  private readonly isDeleteRequested = signal<boolean>(false);
  private readonly lastLoadedClassroomId = signal<string | null>(null);

  readonly filterForm = this.fb.group({
    classSectionId: this.fb.control<string | null>(null),
  });

  filterFormControls = computed<DynamicForm>(() => ({
    formSection: [
      {
        controls: [
          {
            control: this.classroomDropdownConfig(),
            type: DynamicFormControlType.DropDown,
            class: 'col-md-4'
          },
        ],
      },
    ],
  }));

  classroomTimetableGridConfig!: CommonDataGrid<ClassroomTimetableGridRow>;

  readonly refreshButtonConfig = computed<CommonButtonConfig>(() => (CommonHelper.getRefreshButtonConfig(
    () => this.loadTimetableList(this.filterForm.controls.classSectionId.value, true)
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
      this.classroomTimetableGridConfig = {
        ...this.classroomTimetableGridConfig,
        columns: this.buildColumns(),
        features: {
          ...this.classroomTimetableGridConfig.features,
          mergeColumnSpan: this.buildColumns().length
        }
      };
      this.cdr.detectChanges();
    });

    effect(() => {
      if (!this.isDeleteRequested() || !this.timetableStore.isSuccess()) return;
      this.isDeleteRequested.set(false);
      this.loadTimetableList(this.filterForm.controls.classSectionId.value, true);
    });

    effect(() => {
      const options = this.classroomDropdownList();
      this.classroomDropdownConfig.update((config) => ({
        ...config,
        data: options,
      }));

      if (this.isMyTimetable()) return;
      if (options.length > 0 && CommonHelper.isEmpty(this.filterForm.controls.classSectionId.value)) {
        const defaultClassroomId = options[0].value?.toString() || null;
        this.filterForm.controls.classSectionId.patchValue(defaultClassroomId, { emitEvent: false });
        this.loadTimetableList(defaultClassroomId, true);
      }
    });
  }

  ngOnInit(): void {
    this.classroomTimetableGridConfig = this.buildGridConfig();
    this.loadTimeSlotList();
    if (this.isMyTimetable()) {
      this.screenTitle.set(TITLES.STUDENT.MY_TIMETABLE);
      this.loadTimetableList(null, true);
      return;
    }

    this.loadClassroomDropdown();

    this.filterForm.controls.classSectionId.valueChanges.pipe(
      distinctUntilChanged(),
    ).subscribe((classSectionId) => {
      this.loadTimetableList(classSectionId);
    });
  }

  // NEW: per-row time label (fixes the bug where timeslotcol looped all slots)
  getRowTimeRange = (row: ClassroomTimetableGridRow): string => {
    const item = this.getFirstItem(row);
    if (!item?.startTime || !item?.endTime) return '';
    return `${FormatTimeTo12Hour(item.startTime)} ${FormatTimeTo12Hour(item.endTime)}`;
  }
  onEditClick = (row: TimetableCardData | null): void => {
    if (!row?.timeTableId) return;
    this.openDialog(row.timeTableId);
  };

  onAddClick = (row: TimetableCardData | null): void => {
    if (!row || !row.isNoSchedule) return;
    this.openDialog(undefined, row);
  };

  onDeleteClick = (row: TimetableCardData | null): void => {
    if (!row?.timeTableId) return;
    const label = row.displayTitle || row.classSectionName || `${row.startTime || ''}-${row.endTime || ''}` || 'selected row';
    this.commonHelperService.confirmAndCallApi({
      title: this.commonHelperService.handleButtonText(TITLES.ADMIN.CLASSROOM_TIMETABLE, ButtonType.Delete),
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

  getCellRow = (row: ClassroomTimetableGridRow, dayField: keyof ClassroomTimetableGridRow, rowIndex = 0): TimetableCardData | null => {
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
      return {
        ...value,
        displayTitle: value.teacherName ? `${value.teacherName}` : '-',
      };
    }

    return { timeTableId: null, isNoSchedule: true };
  };

  private openDialog = (timeTableId?: string, preselectedSlot?: TimetableCardData): void => {
    this.genericDialog.open({
      width: '800px',
      title: timeTableId ? `Edit ${TITLES.ADMIN.CLASSROOM_TIMETABLE}` : `Add ${TITLES.ADMIN.CLASSROOM_TIMETABLE}`,
      component: TimetableDialog,
      data: {
        timeTableId,
        selectedClassSectionId: this.filterForm.controls.classSectionId.value,
        selectedTimeSlotId: preselectedSlot?.timeSlotId ?? null,
        selectedWeekDayId: preselectedSlot?.weekDayId ?? null,
        source: 'classroom'
      },
    }).afterClosed().subscribe((saved) => {
      if (!saved) return;
      this.loadTimetableList(this.filterForm.controls.classSectionId.value, true);
    });
  };

  private downloadPdf = (): void => {
    let params;
    if (!this.isMyTimetable()) {
      const classSectionId = this.filterForm.controls.classSectionId.value;
      if (classSectionId) {
        params = { classSectionId };
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

  private buildGridConfig = (): CommonDataGrid<ClassroomTimetableGridRow> => {
    return {
      id: 'admin-classroom-timetable-grid',
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

  private buildColumns = (): CommonDataGridColumnConfig<ClassroomTimetableGridRow>[] => {
    return getTimetableGridColumns<ClassroomTimetableGridRow>(
      this.holidayHelperService.excludeWeekdays(),
      this.timeslotcol,
      this.timetableCardCell
    );
  };

  private loadClassroomDropdown = (): void => {
    this.dropdownStore.getDropdown({
      key: ClassroomTimetableComponent.CLASSROOM_DROPDOWN_KEY,
      endpoint: API.ADMIN.CONFIGURATION.CLASSROOM.DROPDOWN,
    });
  };

  private loadTimetableList = (selectedClassroomId?: string | null, force = false): void => {
    const normalizedClassroomId = selectedClassroomId ?? null;
    if (!force && normalizedClassroomId === this.lastLoadedClassroomId()) return;
    const requestBody = createTimetableListRequestBody('classsectionid', normalizedClassroomId);

    this.timetableStore.getAll({
      endpoint: API.ADMIN.CONFIGURATION.TIMETABLE.LIST,
      body: requestBody as any,
    });
    this.lastLoadedClassroomId.set(normalizedClassroomId);
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

  private refreshGridData = (rows: ClassroomTimetableGridRow[]): void => {
    this.classroomTimetableGridConfig = {
      ...this.classroomTimetableGridConfig,
      data: rows,
    };
    this.cdr.detectChanges();
  };

  private rebuildGridRows = (): void => {
    const rows = this.computeGridRows(this.timetableStore.list());
    this.refreshGridData(rows);
  };

  private computeGridRows = (
    records: ClassroomTimetable[],
  ): ClassroomTimetableGridRow[] => {
    const generatedSlots = generateTimeTableSlots<ClassroomTimetable>({
      timeSlots: this.timeSlotStore.list(),
      timetableData: records,
    });
    return buildTimetableGridRows<ClassroomTimetable>(generatedSlots);
  };

  readonly getFirstItem = (row: ClassroomTimetableGridRow): ClassroomTimetable | null => {
    const fields = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
    for (const f of fields) {
      const v = row[f];
      if (this.isTimetableItem(v)) return v;
    }
    return null;
  };

  private isTimetableItem = (value: unknown): value is ClassroomTimetable =>
    !!value && typeof value === 'object' && 'timeTableId' in (value as Record<string, unknown>);

  getBreakTimeRange = (row: ClassroomTimetableGridRow): string => {
    const item = this.getFirstItem(row);
    if (!item?.startTime || !item?.endTime) return '';
    return `${FormatTimeTo12Hour(item.startTime)} - ${FormatTimeTo12Hour(item.endTime)}`;
  };

  ngOnDestroy(): void {
    this.timetableStore.resetState();
    this.timeSlotStore.resetState();
  }
}
