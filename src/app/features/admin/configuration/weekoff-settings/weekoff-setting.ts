import { CommonModule, Location } from "@angular/common";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, DestroyRef, effect, inject, OnInit, signal, TemplateRef, untracked, ViewChild } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { SYSTEM_CONST } from "../../../../core/constants/system.constant";
import { MaterialModule } from "../../../../core/modules/material/material.module";
import { CommonHelperService } from "../../../../core/services/common-helper.service";
import { WeeklyOffLookupStore } from "../../../../core/store/weekly-off-lookup.store";
import { BooleanStatusComponent } from "../../../../shared/components/boolean-status/boolean-status.component";
import { CommonButtonConfig } from "../../../../shared/components/button/model/button.model";
import { CommonDataGridComponent } from "../../../../shared/components/common-data-grid/common-data-grid.component";
import { CommonDataGridFieldDataType } from "../../../../shared/components/common-data-grid/enums/grid.enum";
import { CommonDataGrid, CommonDataGridColumnConfig } from "../../../../shared/components/common-data-grid/model/common-data-grid.model";
import { API } from "../../../../shared/constants/api-url";
import { AllWeekDaysConst } from "../../../../shared/constants/weekdays.constant";
import { buildGridToolbarButton } from "../../../../shared/helpers/grid.helper";
import { GENERAL_SETTINGS_CONST, WeekdaysOff, weekdaysOffStore } from "./models/weekoff-setting.model";

@Component({
  selector: "app-weekoff-setting",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, BooleanStatusComponent, CommonDataGridComponent],
  providers: [weekdaysOffStore],
  templateUrl: "./weekoff-setting.html",
  styleUrl: "./weekoff-setting.scss",
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WeekoffSettingComponent implements OnInit {
  private fb = inject(FormBuilder);
  private location = inject(Location);
  private toastr = inject(ToastrService);
  private cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  readonly weekdaysOffStore = inject(weekdaysOffStore);
  readonly weeklyOffStore = inject(WeeklyOffLookupStore);
  private readonly commonHelperService = inject(CommonHelperService);
  permission = computed(() => this.commonHelperService.getPermissionByPage());

  @ViewChild('checkboxCellTemplate', { static: true }) checkboxCellTemplate!: TemplateRef<any>;

  settingsForm!: FormGroup;
  daysOfWeek = Object.keys(AllWeekDaysConst);
  isEditMode = signal<boolean>(false);
  weeks = [1, 2, 3, 4, 5];
  gridConfig = signal<CommonDataGrid<any> | null>(null);

  readonly SYSTEM_CONST = signal(SYSTEM_CONST);
  readonly PAGE_CONST = signal(GENERAL_SETTINGS_CONST.WEEKDAYS_OFF);

  setEditMode = (isEdit: boolean): void => {
    if (isEdit && !this.permission().canUpdate) return;
    this.isEditMode.set(isEdit);
    this.updateGridConfig();
  };

  editBtn = signal<CommonButtonConfig>(buildGridToolbarButton({
    tooltipText: SYSTEM_CONST.ACTION_BUTTONS.EDIT,
    icon: 'edit',
    callback: () => this.setEditMode(true),
    isPrimary: true
  }));

  saveBtn = signal<CommonButtonConfig>(buildGridToolbarButton({
    tooltipText: SYSTEM_CONST.ACTION_BUTTONS.SAVE,
    icon: 'save',
    callback: () => this.onSave(),
    isPrimary: true
  }));

  cancelBtn = signal<CommonButtonConfig>(buildGridToolbarButton({
    tooltipText: SYSTEM_CONST.ACTION_BUTTONS.CANCEL,
    icon: 'close',
    callback: () => this.onCancel()
  }));

  constructor() {
    this.createForm();

    effect(() => {
      if (this.weekdaysOffStore.isSuccess()) {
        untracked(() => {
          if (this.isEditMode()) {
            this.onCancel();
          }
        });
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.updateGridConfig();
    if (this.permission().canList) {
      this.loadSettings();
    }
  }

  updateGridConfig = (): void => {
    const controls = GENERAL_SETTINGS_CONST.WEEKDAYS_OFF.FORM_CONTROLS;

    const columns: CommonDataGridColumnConfig<any>[] = [
      {
        title: GENERAL_SETTINGS_CONST.WEEKDAYS_OFF.HEADERS.DAY_OF_WEEK,
        field: controls.DAY,
        isSortable: false,
        style: { width: 160 },
        alignment: 'center'
      },
      {
        title: GENERAL_SETTINGS_CONST.WEEKDAYS_OFF.HEADERS.ALL_WEEKS,
        field: controls.ALL_WEEKS,
        isSortable: false,
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.checkboxCellTemplate,
        alignment: 'center',
      }
    ];

    this.weeks.forEach(week => {
      columns.push({
        title: `${GENERAL_SETTINGS_CONST.WEEKDAYS_OFF.HEADERS.WEEK_PREFIX} ${week}`,
        field: `${controls.WEEK_PREFIX}${week}`,
        isSortable: false,
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.checkboxCellTemplate,
        alignment: 'center',
      });
    });

    const toolbarButtons = this.isEditMode() 
      ? [this.cancelBtn(), this.saveBtn()] 
      : (this.permission().canUpdate ? [this.editBtn()] : []);

    this.gridConfig.set({
      id: 'weekdays-off-grid',
      primaryKey: controls.DAY,
      data: this.daysOfWeek.map(day => ({ [controls.DAY]: day })),
      features: {
        showPagination: false,
        showSearch: false,
        toolbar: {
          buttonConfig: toolbarButtons
        }
      },
      columns: columns
    });
  };

  createForm = (): void => {
    this.settingsForm = this.fb.group({
      [GENERAL_SETTINGS_CONST.WEEKDAYS_OFF.FORM_CONTROLS.WEEKDAYS_OFF_ARRAY]: this.fb.array([])
    });
  };

  get weekdaysOffArray(): FormArray {
    return this.settingsForm.get(GENERAL_SETTINGS_CONST.WEEKDAYS_OFF.FORM_CONTROLS.WEEKDAYS_OFF_ARRAY) as FormArray;
  }

  initForm = (): void => {
    const controls = GENERAL_SETTINGS_CONST.WEEKDAYS_OFF.FORM_CONTROLS;
    this.daysOfWeek.forEach(day => {
      const groupConfig: any = {
        [controls.DAY]: [day],
        [controls.ALL_WEEKS]: [false]
      };

      this.weeks.forEach(w => {
        groupConfig[`${controls.WEEK_PREFIX}${w}`] = [false];
      });

      const dayGroup = this.fb.group(groupConfig);

      const weekControls = this.weeks.map(w => `${controls.WEEK_PREFIX}${w}`);

      // 1. Handle "All Weeks" changes -> Sync to individual weeks
      dayGroup.get(controls.ALL_WEEKS)?.valueChanges.subscribe(checked => {
        const patchValues: any = {};
        weekControls.forEach(w => patchValues[w] = checked);
        dayGroup.patchValue(patchValues, { emitEvent: false });
      });

      // 2. Handle individual week changes -> Sync to "All Weeks"
      weekControls.forEach(wName => {
        dayGroup.get(wName)?.valueChanges.subscribe(() => {
          const allChecked = weekControls.every(w => dayGroup.get(w)?.value === true);
          const anyUnchecked = weekControls.some(w => dayGroup.get(w)?.value === false);

          if (allChecked) {
            dayGroup.get(controls.ALL_WEEKS)?.setValue(true, { emitEvent: false });
          } else if (anyUnchecked) {
            dayGroup.get(controls.ALL_WEEKS)?.setValue(false, { emitEvent: false });
          }
        });
      });

      this.weekdaysOffArray.push(dayGroup);
    });
  };

  loadSettings = (): void => {
    this.weekdaysOffStore.getWithResult<WeekdaysOff[]>({
      endpoint: API.ADMIN.CONFIGURATION.GENERAL_SETTINGS.WEEKLY_OFF_CONFIG.GET,
      id: ""
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          if (data && data.length > 0) {
            this.patchFromPayload(data);
            this.weeklyOffStore.setWeeklyOffsData(data);
            this.cdr.markForCheck();
          }
        }
      });
  };

  patchFromPayload = (data: WeekdaysOff[]): void => {
    const controls = GENERAL_SETTINGS_CONST.WEEKDAYS_OFF.FORM_CONTROLS;
    // Reset form before patching
    this.weekdaysOffArray.controls.forEach(control => {
      const resetValue: any = { [controls.ALL_WEEKS]: false };
      this.weeks.forEach(w => resetValue[`${controls.WEEK_PREFIX}${w}`] = false);
      control.patchValue(resetValue, { emitEvent: false });
    });

    data.forEach(item => {
      const dayName = Object.keys(AllWeekDaysConst).find(key => (AllWeekDaysConst as any)[key] === item.weekDay);
      if (dayName) {
        const index = this.daysOfWeek.findIndex(d => d === dayName);
        if (index !== -1) {
          const dayGroup = this.weekdaysOffArray.at(index);
          if (item.weekNumber && item.weekNumber.includes(0)) {
            dayGroup.patchValue({ [controls.ALL_WEEKS]: true });
          } else if (item.weekNumber) {
            const patch: any = {};
            item.weekNumber.forEach((num: number) => {
              if (num >= 1 && num <= 5) {
                patch[`${controls.WEEK_PREFIX}${num}`] = true;
              }
            });
            dayGroup.patchValue(patch);
          }
        }
      }
    });
  };

  transformToPayload = (): WeekdaysOff[] => {
    const controls = GENERAL_SETTINGS_CONST.WEEKDAYS_OFF.FORM_CONTROLS;
    const formValue = this.settingsForm.value[controls.WEEKDAYS_OFF_ARRAY];
    return formValue.map((item: any) => {
      const weekDay = (AllWeekDaysConst as any)[item[controls.DAY]];
      let weekNumbers: number[] = [];

      if (item[controls.ALL_WEEKS]) {
        weekNumbers = [0];
      } else {
        this.weeks.forEach(w => {
          if (item[`${controls.WEEK_PREFIX}${w}`]) weekNumbers.push(w);
        });
      }

      return { weekDay: weekDay, weekNumber: weekNumbers };
    }).filter((item: any) => item.weekNumber.length > 0);
  };

  goBack = (): void => {
    this.location.back();
  };

  onSave = (): void => {
    if (!this.permission().canUpdate) return;
    if (this.settingsForm.invalid) {
      this.toastr.error(SYSTEM_CONST.ERRORS.VALIDATION);
      return;
    }

    const payload = this.transformToPayload();
    this.weekdaysOffStore.create({
      endpoint: API.ADMIN.CONFIGURATION.GENERAL_SETTINGS.WEEKLY_OFF_CONFIG.SAVE,
      body: payload
    });
  };

  onCancel = (): void => {
    if (this.isEditMode()) {
      this.setEditMode(false);
      this.loadSettings(); // Reload to discard changes
    } else {
      this.goBack();
    }
  };
}
