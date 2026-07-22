import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, OnDestroy, OnInit, signal, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { FormGroup } from '@angular/forms';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import {
  CommonDataGrid,
  CommonDataGridColumnConfig,
  CommonDataGridStore,
} from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { MatTabsModule } from '@angular/material/tabs';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { buildGridListRequest } from '../../../../../shared/helpers/grid.helper';
import { API } from '../../../../../shared/constants/api-url';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { UserTypeConst, UserTypeOptions } from '../../../../../shared/constants/user-type.constants';
import { getDropdownConfig } from '../../../../../shared/functions/config-function';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { ITextValueOption } from '../../../../../shared/models/common.model';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { Page, pageStore } from '../models/page.model';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { HttpService } from '../../../../../core/services/http.service';
import { IApiResponse, FilterCondition } from '../../../../../core/models/request.model';

@UntilDestroy()
@Component({
  selector: 'app-page-list',
  standalone: true,
  imports: [CommonModule, CommonDataGridComponent, MatButtonModule, MatTabsModule],
  providers: [pageStore],
  templateUrl: './page.html',
})
export class PageComponent extends GridBase<Page> implements OnInit, OnDestroy {

  protected override store = inject(pageStore);
  readonly selectedTab = signal(0);
  readonly isAction = computed(() => this.selectedTab() === 1);
  private readonly http = inject(HttpService);
  protected override apiEndpoint = API.ADMIN.USER.PAGES.LIST;
  protected override deleteEndpoint = API.ADMIN.USER.PAGES.DELETE;
  protected override primaryKey: keyof Page = 'pageId';
  protected override pageTitle = `${TITLES.USER.PAGES}`;
  protected override routeBasePath = '/admin/user/pages';
  protected override deleteConfirmTitle = SYSTEM_CONST.ACTION_BUTTONS.DELETE;
  protected override deleteConfirmMessage = (row: Page) => SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.pageName);

  readonly parentDropdownList = signal<ITextValueOption[]>([]);
  private lastLoadedUserTypeId: string | null = null;

  readonly userTypeNameOptions: ITextValueOption[] = UserTypeOptions.map(opt => ({
    value: opt.value,
    text: opt.text
  }));

  constructor() {
    super();
    this.registerDropdownReactivity('parentPageId', this.parentDropdownList);
  }

  override ngOnInit(): void {
    const isActionParam = this.router.parseUrl(this.router.url).queryParams['isAction'];
    if (isActionParam === 'true') {
      this.selectedTab.set(1);
    } else {
      this.selectedTab.set(0);
    }
    super.ngOnInit();
  }

  onTabChange(index: number): void {
    this.selectedTab.set(index);
    this.resetGridState();
    this.gridConfig = this.buildGridConfig();

    this.router.navigate([this.routeBasePath], {
      queryParams: { isAction: this.isAction() }
    });
  }

  override onAddClick = (): void => {
    if (!this.permission().canCreate) return;
    this.router.navigate([...this.routeBasePath.split('/'), 'add'], {
      queryParams: { isAction: this.isAction() }
    });
  };

  protected override signalStore = (): CommonDataGridStore<Page> => {
    return {
      ...this.store,
      load: (filter: any) => {
        this.onGridStateChange(filter);

        const requestBody = buildGridListRequest(filter);
        if (!requestBody.columns) {
          requestBody.columns = [];
        }
        requestBody.columns.push({
          name: 'isAction',
          filterSearch: {
            value: String(this.isAction()),
            condition: FilterCondition.Contains
          }
        });

        return this.store.getAll({
          endpoint: this.apiEndpoint,
          body: this.isPostMode ? requestBody : undefined,
        });
      },
    };
  };

  override reloadList = (): void => {
    const state = this.currentGridState();
    const requestBody = buildGridListRequest<Page>({
      pageIndex: state.pageIndex,
      pageSize: state.pageSize,
      defaultSortingColumn: state.sortColumn,
      sortOrder: state.sortOrder,
      generalSearch: state.generalSearch,
      filterData: state.extraFilters,
    });

    if (!requestBody.columns) {
      requestBody.columns = [];
    }
    requestBody.columns.push({
      name: 'isAction',
      filterSearch: {
        value: String(this.isAction()),
        condition: FilterCondition.Contains
      }
    });

    this.store.getAll({
      endpoint: this.apiEndpoint,
      body: requestBody,
    });
  };

  private updateFormControlOptions(formControlName: string, options: ITextValueOption[]): void {
    const filterForm = this.gridConfig?.features?.filter?.form;
    if (!filterForm) return;

    for (const section of filterForm.formSection) {
      const controlConfig = section.controls?.find(
        (c) => (c.control as any).formControlName === formControlName
      );
      if (controlConfig) {
        (controlConfig.control as any).data = options;
        controlConfig.control = { ...controlConfig.control };
      }
    }
    this.gridConfig = { ...this.gridConfig };
  }

  private loadParentPages(userTypeId: string): void {
    if (!userTypeId) {
      this.parentDropdownList.set([]);
      this.lastLoadedUserTypeId = null;
      return;
    }

    // const key = Object.keys(UserTypeConst).find(k => k.toLowerCase() === userTypeId.toLowerCase());
    // const userTypeId = key ? (UserTypeConst as any)[key] : null;

    if (this.lastLoadedUserTypeId === userTypeId) return;
    this.lastLoadedUserTypeId = userTypeId;

    if (userTypeId) {
      this.http.get<IApiResponse<any[]>, any>(
        API.ADMIN.USER.PAGES.PARENT_DROPDOWN,
        { userTypeId: userTypeId, isAction: this.isAction() }
      ).subscribe((response) => {
        const data = response?.data;
        const options = data ? data.map((item: any) => ({
          value: item.value,
          text: item.text
        })) : [];
        this.parentDropdownList.set(options);
      });
    } else {
      this.parentDropdownList.set([]);
    }
  }

  private onFilterFormInit(form: FormGroup): void {
    const userTypeControl = form.get('userTypeName');

    if (userTypeControl?.value) {
      this.loadParentPages(userTypeControl.value);
    }

    userTypeControl?.valueChanges.pipe(untilDestroyed(this)).subscribe((userTypeId) => {
      form.get('parentPageId')?.setValue(null, { emitEvent: false });
      this.loadParentPages(userTypeId);
    });
  }

  protected override buildGridConfig(): CommonDataGrid<Page> {
    const config = super.buildGridConfig();
    config.features = {
      ...config.features,
      showSearch: true,
      filter: {
        formGroupCallback: (form) => this.onFilterFormInit(form),
        form: {
          formSection: [
            {
              controls: [
                {
                  control: {
                    ...getDropdownConfig(
                      'userTypeName',
                      SYSTEM_CONST.LABELS.USER.USER_TYPE,
                      this.userTypeNameOptions
                    ),
                    isFloatLabel: false,
                  },
                  type: DynamicFormControlType.DropDown,
                  class: 'col-12',
                },
                {
                  control: {
                    ...getDropdownConfig(
                      'parentPageId',
                      'Parent Page',
                      this.parentDropdownList()
                    ),
                    isFloatLabel: false,
                  },
                  type: DynamicFormControlType.DropDown,
                  class: 'col-12',
                },
              ],
            },
          ],
        },
      },
    };
    return config;
  }

  private registerDropdownReactivity(
    formControlName: string,
    source: () => ITextValueOption[]
  ): void {
    effect(() => {
      const options = source();
      untracked(() => this.updateFormControlOptions(formControlName, options));
    });
  }

  protected override buildColumns = (): CommonDataGridColumnConfig<Page>[] => {
    return [
      {
        title: 'Page ID',
        field: 'pageId',
        isHidden: true,
      },
      {
        title: 'User Type',
        field: 'userTypeName',
        isSortable: true,
      },
      {
        title: this.isAction() ? 'Page' : 'Parent Page',
        field: 'parentPageName',
        isSortable: true,
      },
      {
        title: this.isAction() ? 'Action Name' : 'Page Name',
        field: 'pageName',
        isSortable: true,
      },
      {
        title: 'Page Code',
        field: 'pageCode',
        isSortable: true,
        isHidden: this.isAction(),
      },
      {
        title: 'URL',
        field: 'url',
        isSortable: true,
        isHidden: this.isAction(),
      },
      {
        title: 'Mnemonic',
        field: 'mnemonic',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.STATUS,
        field: 'isActive',
        isSortable: true,
      },
    ];
  };

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
