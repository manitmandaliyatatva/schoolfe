import { Component, computed, effect, inject, input, OnDestroy, OnInit, output } from "@angular/core";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { SYSTEM_CONST } from "../../../../../core/constants/system.constant";
import { CommonDropdownStore } from "../../../../../core/store/common-dropdown.store";
import { ButtonComponent } from "../../../../../shared/components/button/button.component";
import { CommonButtonConfig } from "../../../../../shared/components/button/model/button.model";
import { DynamicFormComponent } from "../../../../../shared/components/dynamic-form/dynamic-form.component";
import { DynamicForm } from "../../../../../shared/components/dynamic-form/model/dynamic-form.model";
import { API } from "../../../../../shared/constants/api-url";
import { EMPTY_GUID } from "../../../../../shared/constants/app.constants";
import { LookupMnemonics } from "../../../../../shared/constants/lookup-type-ids.constant";
import { getButtonConfig, getDropdownConfig } from "../../../../../shared/functions/config-function";
import { DynamicFormControlType } from "../../../../../shared/models/form-control-base.model";
import { GlobalRefreshService } from "../../../../../core/services/global-refresh.service";

export interface FeeFilterValues {
  classId: string;
  feeTypeId: string;
  status: number;
  adjustmentType: number;
}

@UntilDestroy()
@Component({
  selector: 'app-fee-filter',
  standalone: true,
  imports: [DynamicFormComponent, ReactiveFormsModule, ButtonComponent],
  providers: [CommonDropdownStore],
  template: `
    <div class="filter-wrapper">
      <common-dynamic-form [formControls]="filterFormControls()" [formGroup]="filterForm"></common-dynamic-form>
      @if (showActions()) {
        <div class="filter-actions">
          <common-button [config]="searchBtnConfig()"></common-button>
          <common-button [config]="clearBtnConfig()"></common-button>
        </div>
      }
    </div>
  `,
  styles: [`
    .filter-wrapper {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .filter-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }
  `]
})
export class FeeFilterComponent implements OnInit, OnDestroy {
  // Config Inputs
  showClass = input(false);
  showFeeType = input(false);
  showStatus = input(false);
  showAdjustmentType = input(false);
  showActions = input(true);

  // Default Values
  defaultStatus = input<number | null>(null);
  initialValues = input<FeeFilterValues | null>(null);

  // Outputs
  search = output<FeeFilterValues>();
  clear = output<FeeFilterValues>();

  private readonly fb = inject(FormBuilder);
  private readonly dropdownStore = inject(CommonDropdownStore);
  private readonly globalRefreshService = inject(GlobalRefreshService);

  private readonly DROPDOWN_KEYS = {
    classId: 'feeFilterClassList',
    feeTypeId: 'feeFilterTypeList',
    status: 'feeFilterStatusList',
    adjustmentType: 'feeFilterAdjustmentTypeList',
  } as const;

  private isClassApplied = false;

  readonly classDropdownList = this.dropdownStore.getList(this.DROPDOWN_KEYS.classId);
  readonly feeTypeDropdownList = this.dropdownStore.getList(this.DROPDOWN_KEYS.feeTypeId);
  readonly statusOptionsList = this.dropdownStore.getList(this.DROPDOWN_KEYS.status);
  readonly adjustmentTypeOptionsList = this.dropdownStore.getList(this.DROPDOWN_KEYS.adjustmentType);

  readonly filterForm = this.fb.group({
    classId: this.fb.control<string | null>(null),
    feeTypeId: this.fb.control<string | null>(null),
    status: this.fb.control<number | null>(null),
    adjustmentType: this.fb.control<number | null>(null),
  });

  readonly filterFormControls = computed<DynamicForm>(() => {
    const controls = [];

    const visibleCount = [this.showClass(), this.showFeeType(), this.showStatus(), this.showAdjustmentType()].filter(x => x).length;
    const colClass = visibleCount <= 3 ? 'col-12 col-md-4' : 'col-12 col-md-4 col-lg-3';

    if (this.showClass()) {
      controls.push({
        control: getDropdownConfig('classId', SYSTEM_CONST.LABELS.ACADEMIC.CLASS, this.classDropdownList()),
        type: DynamicFormControlType.DropDown,
        class: colClass,
      });
    }

    if (this.showFeeType()) {
      controls.push({
        control: getDropdownConfig('feeTypeId', SYSTEM_CONST.LABELS.FEE.FEE_TYPE, this.feeTypeDropdownList()),
        type: DynamicFormControlType.DropDown,
        class: colClass,
      });
    }

    if (this.showStatus()) {
      controls.push({
        control: getDropdownConfig('status', SYSTEM_CONST.LABELS.FEE.FEE_STATUS, this.statusOptionsList()),
        type: DynamicFormControlType.DropDown,
        class: colClass,
      });
    }

    if (this.showAdjustmentType()) {
      controls.push({
        control: getDropdownConfig('adjustmentType', SYSTEM_CONST.LABELS.FEE.ADJUSTMENT_TYPE, this.adjustmentTypeOptionsList()),
        type: DynamicFormControlType.DropDown,
        class: colClass,
      });
    }

    return {
      formSection: [{ controls }],
    };
  });

  readonly searchBtnConfig = computed<CommonButtonConfig>(() => ({
    ...getButtonConfig(() => this.onSearch(), 'flat', 'primary', 'Search', false),
    cssClasses: ['btn', 'primary-btn'],
  }));

  readonly clearBtnConfig = computed<CommonButtonConfig>(() => ({
    ...getButtonConfig(() => this.onClear(), 'stroked', 'basic', 'Clear', false),
    cssClasses: ['btn', 'secondary-btn'],
  }));

  constructor() {

    effect(() => {
      const classes = this.classDropdownList();
      if (!this.showClass() || this.isClassApplied || classes.length === 0) {
        return;
      }

      const firstClassId = classes[0].value as string;
      this.filterForm.patchValue({ classId: firstClassId }, { emitEvent: false });
      this.isClassApplied = true;

      // Emit search on initial load if all active filters are ready
      this.onSearch();
    });
  }

  ngOnInit(): void {
    this.loadFilterDropdowns();

    if (this.initialValues()) {
      this.filterForm.patchValue(this.initialValues() as any, { emitEvent: false });
      this.isClassApplied = true;
    } else {
      if (this.showStatus()) {
        this.filterForm.patchValue({ status: this.defaultStatus() }, { emitEvent: false });
      }
    }

    // If not showing class, trigger initial search immediately
    if (!this.showClass() && !this.initialValues()) {
      this.onSearch();
    }

    if (!this.showActions()) {
      this.filterForm.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
        this.onSearch();
      });
    }

    // On academic year change: keep current filter values and reload grid for the new year
    this.globalRefreshService.globalRefreshObservable.pipe(
      untilDestroyed(this)
    ).subscribe(() => {
      this.onSearch();
    });
  }

  onSearch(): void {
    this.search.emit(this.getFilterValues());
  }

  onClear(): void {
    const firstClassId = this.showClass() && this.classDropdownList().length > 0 ? this.classDropdownList()[0].value as string : null;
    this.filterForm.reset({
      classId: firstClassId,
      feeTypeId: null,
      status: this.defaultStatus(),
      adjustmentType: null,
    }, { emitEvent: false });
    this.clear.emit(this.getFilterValues());
  }

  private getFilterValues(): FeeFilterValues {
    const filterValue = this.filterForm.getRawValue();
    return {
      classId: filterValue.classId ?? EMPTY_GUID,
      feeTypeId: filterValue.feeTypeId ?? EMPTY_GUID,
      status: filterValue.status ?? 0,
      adjustmentType: filterValue.adjustmentType ?? 0,
    };
  }

  private loadFilterDropdowns(): void {
    if (this.showClass()) {
      this.dropdownStore.getDropdown({
        key: this.DROPDOWN_KEYS.classId,
        endpoint: API.CLASS.GET_CLASS_DROPDOWN,
      });
    }
    if (this.showFeeType()) {
      this.dropdownStore.getDropdown({
        key: this.DROPDOWN_KEYS.feeTypeId,
        endpoint: API.ADMIN.FEE.FEE_TYPE.DROPDOWN,
      });
    }
    if (this.showStatus()) {
      this.dropdownStore.getDropdown({
        key: this.DROPDOWN_KEYS.status,
        endpoint: API.LOOKUP_VALUE.GET_LOOKUP_VALUE_LIST,
        params: { mnemonic: LookupMnemonics.FeePaymentStatus },
        mapData: (items: any[]) => items.map(item => ({
          text: item.text,
          value: Number(item.value),
          mnemonic: item.mnemonic
        }))
      });
    }
    if (this.showAdjustmentType()) {
      this.dropdownStore.getDropdown({
        key: this.DROPDOWN_KEYS.adjustmentType,
        endpoint: API.LOOKUP_VALUE.GET_LOOKUP_VALUE_LIST,
        params: { mnemonic: LookupMnemonics.FeeAdjustmentType },
        mapData: (items: any[]) => items.map(item => ({
          text: item.text,
          value: Number(item.value),
          mnemonic: item.mnemonic
        }))
      });
    }
  }

  ngOnDestroy(): void {
    this.dropdownStore.resetState();
  }
}

