import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  signal,
  untracked,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  ControlContainer,
  FormControl,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MatFormField,
  MatFormFieldAppearance,
  MatFormFieldModule,
  MatLabel
} from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import {
  MatOption,
  MatSelect,
  MatSelectModule
} from '@angular/material/select';
import {
  DROPDOWN_SELECT_ALL_VALUE,
  CommonDropdownConfig,
  DropdownSelectionResult
} from './model/common-dropdown.model';
import { CommonErrorComponent } from '../common-error/common-error.component';
import { map, distinctUntilChanged, debounceTime, asyncScheduler } from 'rxjs';
import { ITextValueOption } from '../../models/common.model';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-common-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatInputModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatOption,
    MatLabel,
    MatFormField,
    NgxMatSelectSearchModule,
    CommonErrorComponent,
  ],
  viewProviders: [
    {
      provide: ControlContainer,
      useExisting: FormGroupDirective,
    },
  ],
  templateUrl: './common-dropdown.component.html',
  styleUrl: './common-dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonDropdownComponent implements OnInit {

  // ✅ Input signal
  config = input.required<CommonDropdownConfig>();

  // ✅ State signals
  parentFormGroup = signal<FormGroup | null>(null);
  dropDownOptions = signal<ITextValueOption[]>([]);
  isLoaded = signal<boolean>(false);
  isDisabled = signal<boolean>(false);
  isRequired = signal<boolean>(false);
  hideClearSearchButton = signal<boolean>(false);
  defaultSearchPlaceholder = signal<string>('Search');
  defaultNoEntriesLabel = signal<string>('No Data Found');
  selectedItemsToDisplay = signal<number>(2);
  isChecked = signal<boolean>(false);
  isIndeterminate = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  pageIndex = signal<number>(0);
  pageSize = signal<number>(10);
  allOptionsLoaded = signal<boolean>(false);
  filteredOptions = signal<ITextValueOption[]>([]);
  dropDownOption: ITextValueOption[] = []
  isArabic = signal<boolean>(false);
  isSelectAllSelected = signal<boolean>(false);

  // ✅ Typed model value
  dropdownModelValue: any;

  readonly SELECT_ALL_VALUE = DROPDOWN_SELECT_ALL_VALUE;

  public dropdownSearchCtrl = new FormControl<string>('');

  @ViewChild('select') select!: MatSelect;

  // ✅ Computed signals
  isFormReady = computed(() => this.parentFormGroup() !== null);

  // ✅ Injections
  private controlContainer = inject(ControlContainer);
  cdRef = inject(ChangeDetectorRef);

  constructor() {
    // ✅ effect() replaces ngOnChanges — reacts to config() signal changes
    effect(() => {
      const cfg = { ...this.config() };

      cfg.selectedOptions = cfg.selectedOptions ?? [];

      if (untracked(() => this.isFormReady())) {
        untracked(() => this.setDropdownOptions(cfg.data));
        untracked(() => this.setSelectedValue());
        untracked(() => this.checkSelectAllState());
        untracked(() => this.toggleControlState());
        this.cdRef.markForCheck();
      }
    });
  }

  ngOnInit(): void {
    const control = this.controlContainer?.control;

    // ✅ Only set if actually a FormGroup
    if (control instanceof FormGroup) {
      this.parentFormGroup.set(control);
    }

    this.setControlDefaultValue();
    this.isDisabled.set(this.control?.disabled ?? false);
    this.isRequired.set(this.control?.hasValidator(Validators.required) ?? false);
    this.hideClearSearchButton.set(!!this.config().features?.hideClearSearchButton);

    if (this.config().features?.showAllOptions) {
      this.selectedItemsToDisplay.set(Infinity);
    }

    this.selectedItemsToDisplay.set(
      this.config().features?.selectedItemsToDisplay
      ?? this.selectedItemsToDisplay()
    );

    this.pageSize.set(
      this.config().features?.pageSize ?? 10
    );

    // ✅ Subscribe to control status changes
    this.control?.statusChanges
      .pipe(
        map(status => status === 'DISABLED'),
        distinctUntilChanged(),
        untilDestroyed(this)
      )
      .subscribe(x => this.isDisabled.set(x));

    this.control?.valueChanges
      .pipe(distinctUntilChanged(), untilDestroyed(this))
      .subscribe(x => {
        if (x !== -1) {
          this.dropdownModelValue = x;
        }
        if (this.isAllowMultiple) {
          this.setToggleState();
        }
        this.cdRef.markForCheck();
      });

    this.control?.statusChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.isRequired.set(
          this.control.hasValidator(Validators.required)
        );
        this.cdRef.markForCheck();
      });

    this.dropdownSearchCtrl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), untilDestroyed(this))
      .subscribe(() => {
        this.dropDownOptions() ? this.filterData() : [];
      });

    this.setDropdownOptions(this.config().data);
    this.setSelectedValue();
    this.toggleControlState();
  }

  // ─── Getters ────────────────────────────────────────────────────────────────

  get selectedItemsCount(): number {
    if (
      this.config().features?.allowMultiple &&
      this.dropdownModelValue &&
      Array.isArray(this.dropdownModelValue)
    ) {
      return this.dropdownModelValue
        .filter(v => v !== this.SELECT_ALL_VALUE).length;
    }
    return 0;
  }

  get selectedItemsTooltip(): string | null {
    if (
      this.config().features?.allowMultiple &&
      this.dropdownModelValue &&
      Array.isArray(this.dropdownModelValue)
    ) {
      const realValues = this.dropdownModelValue
        .filter(v => v !== this.SELECT_ALL_VALUE);
      return this.dropDownOptions()
        .filter(item => realValues.includes(item.value))
        .map(item => item.text)
        .join('\n') ?? null;
    }
    return null;
  }

  get appearance(): MatFormFieldAppearance {
    return this.config().appearance
      ? this.config().appearance!
      : 'outline';
  }

  get id(): string {
    return this.config().id ?? '';
  }

  get selectedItemClass(): string {
    return this.selectedItemsCount > this.selectedItemsToDisplay()
      ? 'selected-many'
      : 'selected-' + this.selectedItemsCount;
  }

  get control(): AbstractControl {
    return this.parentFormGroup()?.get(this.config().formControlName)!;
  }

  get formControlName(): string {
    return this.config().formControlName;
  }

  get isAllowMultiple(): boolean {
    return !!this.config().features?.allowMultiple;
  }

  get isAllowClear(): boolean {
    return this.config().features?.allowClear !== false;
  }

  get hideChips(): boolean {
    return this.config().features?.hideChips ?? false;
  }

  get isAllowSearching(): boolean {
    return this.config().features?.allowSearching !== false;
  }

  get searchPlaceholderLabel(): string {
    const label = this.config().features?.searchPlaceholderLabel;
    return label && label !== ''
      ? label
      : this.defaultSearchPlaceholder();
  }

  get searchNoEntriesFoundLabel(): string {
    const label = this.config().features?.searchNoEntriesFoundLabel;
    return label && label !== ''
      ? label
      : this.defaultNoEntriesLabel();
  }

  get showToggleAllCheckbox(): boolean {
    const show = this.config().features?.showToggleAllCheckbox !== false;
    return show && this.dropDownOptions().length > 0;
  }

  get isError(): boolean {
    return !!(this.control?.touched && this.control?.errors);
  }

  get floatLabel(): boolean {
    return this.config().isFloatLabel !== false;
  }

  get selectedChips(): (string | number | boolean)[] {
    const realValues = (this.dropdownModelValue as any[])
      ?.filter(v => v !== this.SELECT_ALL_VALUE) || [];
    return realValues.slice(0, this.selectedItemsToDisplay());
  }

  get noMoreData(): boolean {
    return this.dropDownOptions()?.filter(x => !x?.hidden)?.length === 0;
  }

  get allowGrouping(): boolean {
    return this.config()?.features?.allowGrouping ?? false;
  }

  get enableSelectAllOption(): boolean {
    return !!this.config().features?.enableSelectAllOption && this.isAllowMultiple;
  }

  get selectAllOptionLabel(): string {
    return this.config().features?.selectAllOptionLabel ?? '';
  }

  // ─── errorConfig ────────────────────────────────────────────────────────────

  errorConfig = () => {
    const control = this.parentFormGroup()?.get(this.formControlName);
    if (!control) return undefined;
    return {
      control,
      formStatus: this.parentFormGroup()?.status ?? null,
      controlName: this.config().label
    };
  };

  // ─── Methods ────────────────────────────────────────────────────────────────

  setDropdownOptions = (data: ITextValueOption[]): void => {
    let processedData = data?.length > 0 ? [...data] : [];

    if (this.config().features?.excludeCallback) {
      processedData = processedData.filter(item => !this.config().features!.excludeCallback!(item));
    }

    this.dropDownOptions.set(processedData);

    if (this.isAllowMultiple) {
      this.setToggleState();
      this.checkSelectAllState();
    }

    if (
      this.config().features?.enableLazyLoading &&
      this.config().features?.loadDataFromApi
    ) {
      this.dropDownOptions.set(structuredClone(this.config().selectedOptions ?? []));
      this.pageIndex.set(0);
      this.allOptionsLoaded.set(false);
      this.config().data = structuredClone(this.dropDownOptions());
    }

    if (
      this.config().features?.enableLazyLoading &&
      !this.config().features?.loadDataFromApi
    ) {
      this.dropDownOptions.set(structuredClone(this.config().selectedOptions ?? []));
    }

    this.isLoaded.set(true);
  }

  selectionChange = (): void => {
    if (!this.config().features?.allowMultiple) {
      this.setFormControlValue();
    }
  }

  getMultiSelectedOptionForDisplay = (option: string): string => {
    if (this.config().features?.loadDataFromApi) {
      this.config().data = this.dropDownOptions();
    }
    return this.dropDownOptions()?.find(y => y.value == option)?.text ?? '';
  }

  getSelectedOptionForDisplay = (): string => {
    if (
      this.dropdownModelValue === null ||
      this.dropdownModelValue === undefined
    ) {
      return '';
    }
    if (this.config().features?.loadDataFromApi) {
      this.config().data = this.dropDownOptions();
    }
    const selectedOption = this.config().data?.find(
      x => x.value == this.dropdownModelValue
    );
    const display = selectedOption ? selectedOption.text : '';
    return display ? display.replace(/,\s*$/, '') : '';
  }

  optionClick = (): void => {
    if (this.config().features?.allowMultiple) {
      const allOptions = this.dropDownOptions().map(x => x.value);
      let selectedWithoutSelectAll = (this.dropdownModelValue as any[])
        .filter(v => v !== this.SELECT_ALL_VALUE);

      if (this.enableSelectAllOption) {
        const allSelected = allOptions.every(
          val => selectedWithoutSelectAll.includes(val)
        );
        this.isSelectAllSelected.set(allSelected);

        this.dropdownModelValue = allSelected
          ? [this.SELECT_ALL_VALUE, ...selectedWithoutSelectAll]
          : selectedWithoutSelectAll;
      } else {
        this.dropdownModelValue = selectedWithoutSelectAll;
      }

      this.resetOptionsPosition();
    }
    this.setFormControlValue();
    !this.config().features?.enableLazyLoading && this.filterData();
  }

  onSelectAllOptionClick = (checked: boolean): void => {
    const allOptions = this.dropDownOptions().map(x => x.value);
    this.isSelectAllSelected.set(checked);
    this.dropdownModelValue = checked ? allOptions : [];
    this.setFormControlValue();
    this.filterData();
    this.resetOptionsPosition();
    this.cdRef.detectChanges();
  }

  clear = (event: Event): void => {
    if (this.isAllowClear) {
      this.dropdownModelValue = this.config().features?.allowMultiple
        ? []
        : null;
      this.isSelectAllSelected.set(false);
      this.setFormControlValue();
      setTimeout(() => this.select.close(), 0);
    }
  }

  setFormControlValue = (): void => {
    this.control.setValue(this.dropdownModelValue);
    this.control.updateValueAndValidity();
    this.control.markAsDirty();

    if (
      this.config().features?.allowMultiple &&
      Array.isArray(this.dropdownModelValue)
    ) {
      const realValues = this.dropdownModelValue
        .filter(v => v !== this.SELECT_ALL_VALUE);
      const selectedOptions: ITextValueOption[] = [];

      if (this.allowGrouping) {
        const selectedOptionValue = Array.from(realValues)
          .filter(x => !this.config()?.selectedOptions?.some(y => y.value === x))[0];
        const selectedOptionGroupId = this.dropDownOptions()
          .find(x => x.value === selectedOptionValue)?.groupId;
        const sameGroupIdOption = this.config()?.selectedOptions
          ?.find(x => x.groupId === selectedOptionGroupId && selectedOptionGroupId != null);

        if (sameGroupIdOption) {
          this.dropdownModelValue = this.dropdownModelValue
            .filter(x => x !== sameGroupIdOption.value);
          this.control.setValue(this.dropdownModelValue);
          this.control.updateValueAndValidity();
          this.control.markAsDirty();
        }
      }

      Array.from(realValues).forEach(item => {
        const opt = this.dropDownOptions()?.find(e => e.value == item);
        if (opt) selectedOptions.push(opt);
      });

      this.config().selectedOptions = selectedOptions.map(
        option => ({ ...option, hidden: true })
      );

      if (this.enableSelectAllOption) {
        const result: DropdownSelectionResult = {
          values: realValues,
          isSelectAllSelected: this.isSelectAllSelected()
        };
        this.config()?.selectionChange?.(result as any);
      } else {
        this.config()?.selectionChange?.(selectedOptions);
      }
    } else {
      const selectedOption = this.dropDownOptions()
        ?.find(x => x.value == this.dropdownModelValue);
      if (selectedOption) {
        this.config().selectedOptions = [{ ...selectedOption, hidden: true }];
        this.config()?.selectionChange?.(selectedOption);
      }
    }
  }

  filterData = (): void => {
    if (
      this.isAllowSearching &&
      !this.config().features?.enableLazyLoading
    ) {
      const search = this.dropdownSearchCtrl.value?.toLowerCase();
      this.config().data.forEach(x => {
        x.hidden = x.text.toLowerCase().indexOf(search ?? '') <= -1;
      });
      this.setDropdownOptions(this.config().data);
      this.cdRef.detectChanges();
    } else if (
      this.isAllowSearching &&
      this.config().features?.enableLazyLoading &&
      !this.config().features?.loadDataFromApi
    ) {
      this.filterForNonApiSearch();
    } else if (
      this.isAllowSearching &&
      this.config().features?.enableLazyLoading &&
      this.config().features?.loadDataFromApi
    ) {
      this.filterForApiSearch();
    }
  }

  filterForApiSearch = (): void => {
    this.pageIndex.set(0);
    this.pageSize.set(10);
    this.dropDownOptions.set([...structuredClone(this.config().selectedOptions)!]);
    this.loadMoreOptions();
  }

  filterForNonApiSearch = (): void => {
    this.pageIndex.set(0);
    this.pageSize.set(10);
    const search = this.dropdownSearchCtrl.value?.toLowerCase();
    const searchLower = search?.toLowerCase();
    const filteredData = this.config().data!.filter(
      item => item.text.toLowerCase().includes(searchLower ?? '')
    );
    this.dropDownOptions.set([...structuredClone(this.config().selectedOptions)!]);
    this.filteredOptions.set([...filteredData]);
    this.loadMoreOptions();
  }

  toggleSelectAll = (selectAllValue: boolean): void => {
    const allOptions = selectAllValue
      ? this.dropDownOptions().map(x => x.value)
      : [];
    this.dropdownModelValue = allOptions;
    this.setFormControlValue();
    this.filterData();
    this.resetOptionsPosition();
  }

  removeOption = (option: string): void => {
    const index = (this.dropdownModelValue as any[]).indexOf(option);
    if (index >= 0) {
      (this.dropdownModelValue as any[]).splice(index, 1);
      if (this.enableSelectAllOption) {
        this.isSelectAllSelected.set(false);
        this.dropdownModelValue = (this.dropdownModelValue as any[])
          .filter(v => v !== this.SELECT_ALL_VALUE);
      }
      this.dropdownModelValue = [...(this.dropdownModelValue as any[])];
      this.setFormControlValue();
    }
    this.control.markAsTouched();
  }

  isAllSelected = (): boolean => {
    return this.selectedItemsCount === this.dropDownOptions()?.length;
  }

  selectedItemsChipLabel(): string {
    if (this.enableSelectAllOption && this.isAllSelected()) {
      return this.selectAllOptionLabel;
    }
    return '';
  }

  onDropdownOpened = (opened: boolean): void => {
    if (opened) {
      if (this.enableSelectAllOption) {
        this.checkSelectAllState();
      }
      if (this.config()?.features?.enableLazyLoading) {
        setTimeout(() => {
          const panel = this.select.panel?.nativeElement;
          if (panel) {
            panel.removeEventListener('scroll', this.onScroll); // avoid duplicates
            panel.addEventListener('scroll', this.onScroll.bind(this));
            if (!this.isLoading() && !this.allOptionsLoaded()) {
              this.loadMoreOptions();
            }
          }
        });
      }
    }
  }

  onScroll = (event: Event): void => {
    const threshold = 50;
    const panel = event.target as HTMLElement;
    const atBottom =
      panel.scrollTop + panel.clientHeight >=
      panel.scrollHeight - threshold;
    // ✅ signals called with ()
    if (atBottom && !this.isLoading() && !this.allOptionsLoaded()) {
      this.loadMoreOptions();
    }
  }

  loadMoreOptions = (): void => {
    this.allOptionsLoaded.set(false);
    this.isLoading.set(true);

    if (this.config().features?.loadDataFromApi) {
      const search = this.dropdownSearchCtrl.value?.toLowerCase();
      // ✅ pageIndex and pageSize called with ()
      this.config().getMoreOptions!(
        this.pageIndex(),
        this.pageSize(),
        search
      ).then(options => {
        this.setData(options.data, options.pageCount, options.totalCount);
      });
    } else {
      const search = this.dropdownSearchCtrl.value?.toLowerCase();
      if (search?.trim()) {
        this.getFilteredSearchedOptions().then(options => {
          // ✅ filteredOptions called with ()
          this.setData(options, this.filteredOptions().length);
        });
      } else {
        this.getOptions().then(options => {
          this.setData(options, this.config().data.length);
        });
      }
    }
  }

  setData(options, pageCount, totalCount?: number) {
    if (options.length === 0) return;

    if (this.pageIndex() === 0) {
      this.dropDownOption.splice(0, this.dropDownOption.length);
    }

    this.isLoading.set(false);

    const selectedOptions = structuredClone(this.config().selectedOptions);
    const selectedData = selectedOptions?.map(res => res.value) || [];

    const optionsId = options?.map(res => res.value) || [];

    const existingValues = new Set([
      ...this.dropDownOption.map(opt => opt.value),
      ...selectedData
    ]);

    const filteredOptions = options.filter(
      opt => !existingValues.has(opt.value)
    );

    for (let i = this.dropDownOption.length - 1; i >= 0; i--) {
      const option = this.dropDownOption[i];
      if (
        selectedData.includes(option.value) &&
        option.hidden &&
        optionsId.includes(option.value)
      ) {
        option.value = -1;
      }
    }

    this.dropDownOption.push(...filteredOptions);

    this.allOptionsLoaded.set(options.length < this.pageSize());
    const totalLoaded = this.dropDownOption.length + selectedData.length;
    if (totalLoaded >= totalCount) {
      this.allOptionsLoaded.set(true);
      return;
    }
    this.pageIndex.update(val => val + 1);
    this.cdRef.detectChanges();
  }

  getFilteredSearchedOptions = (): Promise<ITextValueOption[]> => {
    return new Promise(resolve => {
      const start = (this.pageIndex() - 1) * this.pageSize();
      const end = start + this.pageSize();
      resolve(this.filteredOptions().slice(start, end));
    });
  }

  getOptions = (): Promise<ITextValueOption[]> => {
    return new Promise(resolve => {
      const start = (this.pageIndex() - 1) * this.pageSize();
      const end = start + this.pageSize();
      resolve(this.config().data.slice(start, end));
    });
  }

  toggleControlState = (): void => {
    const isDisable = this.config()?.features?.isDisable;
    if (this.control && typeof isDisable === 'boolean') {
      isDisable ? this.control.disable() : this.control.enable();
    }
  }

  // ─── Private Methods ────────────────────────────────────────────────────────

  private resetOptionsPosition = (): void => {
    asyncScheduler.schedule(() => {
      const overlayDir = (this.select as any)?._overlayDir;
      overlayDir?.overlayRef?.updatePosition();
    }, 0);
  }

  private setToggleState = (): void => {
    const selectedValue = this.control?.value
      ? Array.from(this.control.value)
      : [];

    if (selectedValue.length > 0 && this.dropDownOptions()?.length > 0) {
      const matched = this.dropDownOptions().filter(
        x => selectedValue.findIndex(y => y == x.value) > -1
      ).length;
      this.isIndeterminate.set(this.dropDownOptions().length > matched);
      this.isChecked.set(this.dropDownOptions().length === matched);
    } else {
      this.isIndeterminate.set(false);
      this.isChecked.set(false);
    }
  }

  private setControlDefaultValue = (): void => {
    if (this.control?.value == null && this.isAllowMultiple) {
      this.control.setValue([], { emitEvent: false });
    }
  }

  private setSelectedValue = (): void => {
    if (this.isAllowMultiple) {
      if (this.control?.value?.length > 0) {
        let selectedValue = Array.from(new Set(this.control.value));
        if (this.allowGrouping) {
          if (
            this.config()?.selectedOptions?.length === 0 &&
            selectedValue?.length > 0
          ) {
            this.config().selectedOptions = this.dropDownOptions()
              ?.filter(x => selectedValue?.includes(x.value))
              ?.map(option => ({ ...option, hidden: true }));
          }
        }
        this.dropdownModelValue = selectedValue;
      }
      this.checkSelectAllState();
    } else {
      this.dropdownModelValue = this.control?.value;
    }
  }

  private checkSelectAllState = (): void => {
    if (
      this.enableSelectAllOption &&
      this.dropdownModelValue &&
      this.dropDownOptions()?.length > 0
    ) {
      const allOptionValues = this.dropDownOptions().map(x => x.value);
      const selectedWithoutSelectAll = Array.from(
        this.dropdownModelValue as any[] || []
      ).filter(v => v !== this.SELECT_ALL_VALUE);

      const allSelected =
        allOptionValues.length > 0 &&
        allOptionValues.every(val => selectedWithoutSelectAll.includes(val));

      this.isSelectAllSelected.set(allSelected);

      if (
        allSelected &&
        !(this.dropdownModelValue as any[]).includes(this.SELECT_ALL_VALUE)
      ) {
        this.dropdownModelValue = selectedWithoutSelectAll;
      } else if (
        !allSelected &&
        (this.dropdownModelValue as any[]).includes(this.SELECT_ALL_VALUE)
      ) {
        this.dropdownModelValue = selectedWithoutSelectAll;
      }
    }
  }
}