import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AuthStore } from '../../../../../store/auth.store';
import { API } from '../../../../../../shared/constants/api-url';
import { GlobalRefreshService } from '../../../../../services/global-refresh.service';
import { CommonDropdownComponent } from '../../../../../../shared/components/common-dropdown/common-dropdown.component';
import { CommonDropdownConfig } from '../../../../../../shared/components/common-dropdown/model/common-dropdown.model';
import { AcademicYearDropdown, academicYearStore } from '../../../../../../features/admin/configuration/academic-year/models/academic-year.model';
import CommonHelper from '../../../../../helpers/common-helper';
import { getDropdownConfig } from '../../../../../../shared/functions/config-function';
import { headerFilterStore, HEADER_FILTER_CONST, BranchDropdownResponse, branchDropdownStore, ROLE_ICON_MAPPING, HeaderFilter, BranchUserType } from './model/header-filters.model';
import { ConfirmationService } from '../../../../../../shared/services/dialog.service';
import { SYSTEM_CONST } from '../../../../../constants/system.constant';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MenuPermissionStore } from '../../../../../store/menu-permission.store';
import { CommonHelperService } from '../../../../../services/common-helper.service';

@UntilDestroy()
@Component({
  selector: 'app-header-filters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CommonDropdownComponent,
    MatMenuModule,
    MatIconModule
  ],
  templateUrl: './header-filters.component.html',
  styleUrls: ['./header-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderFiltersComponent implements OnInit {
  @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;

  private readonly fb = inject(FormBuilder);
  readonly authStore = inject(AuthStore);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly globalRefreshService = inject(GlobalRefreshService);
  private readonly router = inject(Router);

  readonly academicYearStore = inject(academicYearStore);
  readonly headerFilterStore = inject(headerFilterStore);
  readonly branchDropdownStore = inject(branchDropdownStore);
  readonly menuStore = inject(MenuPermissionStore);
  private readonly commonHelper = inject(CommonHelperService);
  readonly FILTER_CONST = HEADER_FILTER_CONST;

  formGroup = this.fb.group({
    academicYearId: [this.authStore.academicyearid()],
    branchId: [this.authStore.branchid()]
  });

  readonly academicYearConfig = signal<CommonDropdownConfig>(null);

  branches = signal<BranchDropdownResponse[]>([]);
  expandedBranchId = signal<string | null>(this.authStore.branchid());

  currentBranchName = computed(() => {
    const activeBranchId = this.authStore.branchid();
    const list = this.branches();
    const activeBranch = list.find(b => b.branchId?.toLowerCase() === activeBranchId?.toLowerCase());
    return activeBranch?.branchName || '';
  });

  currentRoleName = computed(() => {
    return this.authStore.usertype() || '';
  });

  showBranchDropdown = computed(() => {
    const role = (this.authStore.usertype() || '').toLowerCase();
    const isAdminOrSuperAdmin = role.includes('admin');
    if (isAdminOrSuperAdmin) {
      return true;
    }

    const list = this.branches();
    const hasMultipleRolesInAnyBranch = list.some(b => b.userTypes && b.userTypes.length > 1);
    const hasMultipleBranches = list.length > 1;

    return hasMultipleRolesInAnyBranch || hasMultipleBranches;
  });

  constructor() {
    effect(() => {
      this.formGroup.patchValue({
        academicYearId: this.authStore.academicyearid(),
        branchId: this.authStore.branchid()
      }, { emitEvent: false });

      // Auto-expand the active branch on load/change
      const activeBranchId = this.authStore.branchid();
      if (activeBranchId) {
        this.expandedBranchId.set(activeBranchId);
      }
    });
  }

  ngOnInit(): void {
    this.loadDropdownData();
  }

  toggleBranch = (branchId: string, event: Event): void => {
    event.stopPropagation();
    this.expandedBranchId.set(this.expandedBranchId() === branchId ? null : branchId);
  }

  selectBranchRole = (branch: BranchDropdownResponse, role: BranchUserType): void => {
    if (branch.branchId?.toLowerCase() === this.authStore.branchid()?.toLowerCase() &&
      role.userTypeName === this.authStore.usertype()) {
      return;
    }

    this.confirmationService.confirm({
      title: HEADER_FILTER_CONST.CONFIRM_ROLE_CAMPUS_CHANGE_TITLE,
      message: HEADER_FILTER_CONST.CONFIRM_ROLE_CAMPUS_CHANGE_MESSAGE(role.userTypeName, branch.branchName),
      confirmText: SYSTEM_CONST.ACTION_BUTTONS.CONFIRM,
      cancelText: SYSTEM_CONST.ACTION_BUTTONS.CANCEL
    }).pipe(untilDestroyed(this)).subscribe((confirmed) => {
      if (confirmed) {
        this.menuTrigger?.closeMenu();
        this.updateGlobalFilters(true, {
          academicYearId: this.authStore.academicyearid() || '',
          branchId: branch.branchId,
          userTypeName: role.userTypeName
        });
      }
    });
  }

  getRoleIcon = (roleName: string): string => {
    const key = roleName?.toLowerCase() || '';
    return ROLE_ICON_MAPPING[key] || 'person';
  }

  getBranchColor = (index: number): string => {
    const colors = ['#6366f1', '#f97316', '#10b981', '#ec4899', '#8b5cf6'];
    return colors[index % colors.length];
  }

  private loadDropdownData = (): void => {
    const requests = {
      academicYears: this.academicYearStore.getWithResult<AcademicYearDropdown[]>({
        endpoint: API.ADMIN.CONFIGURATION.ACADEMIC_YEAR.DROPDOWN
      }).pipe(catchError(() => of([]))),
      branches: this.branchDropdownStore.getWithResult<BranchDropdownResponse[]>({
        endpoint: API.SUPER_ADMIN.BRANCH.DROPDOWN
      }).pipe(catchError(() => of([])))
    };

    const isCurrentYearEmpty = CommonHelper.isEmpty(this.authStore.academicyearid());

    forkJoin(requests).pipe(untilDestroyed(this)).subscribe(({ academicYears, branches }) => {
      const academinYearListNotEmpty = CommonHelper.isNotEmptyArray(academicYears);
      const branchList: BranchDropdownResponse[] = branches || [];

      this.branches.set(branchList);

      // Process Academic Years
      if (academinYearListNotEmpty) {
        if (isCurrentYearEmpty) {
          const currentYear = academicYears.find((x) => x.isCurrent);
          if (currentYear) {
            this.formGroup.patchValue({ academicYearId: currentYear.value as string });
          }
        }

        this.academicYearConfig.set({
          ...getDropdownConfig('academicYearId', '', academicYears),
          selectionChange: () => this.onFilterChange()
        });
      }
    });
  }

  onFilterChange = (): void => {
    this.confirmationService.confirm({
      title: HEADER_FILTER_CONST.CONFIRM_TITLE,
      message: HEADER_FILTER_CONST.CONFIRM_MESSAGE,
      confirmText: SYSTEM_CONST.ACTION_BUTTONS.CONFIRM,
      cancelText: SYSTEM_CONST.ACTION_BUTTONS.CANCEL
    }).pipe(untilDestroyed(this)).subscribe((confirmed) => {
      if (confirmed) {
        const payload = {
          ...this.formGroup.getRawValue(),
          userTypeName: this.authStore.usertype()
        } as HeaderFilter;
        this.updateGlobalFilters(false, payload);
      } else {
        this.formGroup.patchValue({
          academicYearId: this.authStore.academicyearid(),
          branchId: this.authStore.branchid()
        }, { emitEvent: false });
      }
    });
  }

  updateGlobalFilters = (isRoleChange: boolean, body: HeaderFilter): void => {
    this.headerFilterStore.createWithResult({
      endpoint: API.WIDGET_CONFIG.GLOBAL_FILTERS,
      body
    }).pipe(untilDestroyed(this)).subscribe({
      next: (res: any) => {
        const token = typeof res === 'string' && !CommonHelper.isEmpty(res) ? res : null;
        if (token) {
          if (isRoleChange) {
            this.commonHelper.handlePostLogin(token);
            this.loadDropdownData();
            return;
          }
          this.authStore.updateAccessTokens(token, () => {
            // Redirect to list page if currently on an add/edit form, view, or history page
            const url = this.router.url;
            const path = url.split('?')[0].split('#')[0];
            const segments = path.split('/');
            const actionIndex = segments.findIndex(seg =>
              seg === 'add' || seg === 'edit' || seg === 'history' || seg === 'view'
            );

            if (actionIndex !== -1) {
              const redirectUrl = segments.slice(0, actionIndex).join('/');
              if (redirectUrl) {
                this.router.navigateByUrl(redirectUrl);
              }
            }

            this.globalRefreshService.triggerGlobalRefresh();
          });
        }
        else {
          this.authStore.frontendLogout();
        }
      }
    });
  }
}
