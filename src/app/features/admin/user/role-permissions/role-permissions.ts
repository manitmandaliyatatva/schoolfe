import { Component, OnInit, OnDestroy, inject, signal, computed, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { patchState } from '@ngrx/signals';

import {
  RolePermissionTree,
  userTypeStore,
  rolesStore,
  permissionTreeStore,
  permissionSaveStore
} from './models/role-permissions.model';
import { ToastrHelperService } from '../../../../core/services/toster-helper.service';
import { API } from '../../../../shared/constants/api-url';
import { ICON_MAPPING } from '../../../../core/constants/system.constant';
import { SYSTEM_CONST } from '../../../../core/constants/system.constant';
import { CommonButtonConfig } from '../../../../shared/components/button/model/button.model';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { getButtonConfig, getDropdownConfig, getTextboxConfig } from '../../../../shared/functions/config-function';
import { CommonDropdownComponent } from '../../../../shared/components/common-dropdown/common-dropdown.component';
import { CommonDropdownConfig } from '../../../../shared/components/common-dropdown/model/common-dropdown.model';
import { TextboxComponent } from '../../../../shared/components/textbox/textbox.component';
import { CommonTextboxConfig } from '../../../../shared/components/textbox/model/textbox.model';
import { InputType } from '../../../../shared/Enums/common.enum';
import { ConfirmationService } from '../../../../shared/services/dialog.service';

@Component({
  selector: 'app-role-permissions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    ButtonComponent,
    CommonDropdownComponent,
    TextboxComponent
  ],
  providers: [userTypeStore, rolesStore, permissionTreeStore, permissionSaveStore],
  templateUrl: './role-permissions.html',
  styleUrls: ['./role-permissions.scss']
})
export class RolePermissionsComponent implements OnInit, OnDestroy {
  readonly ICON_MAPPING = ICON_MAPPING;
  readonly userTypeStore = inject(userTypeStore);
  readonly rolesStore = inject(rolesStore);
  readonly permissionTreeStore = inject(permissionTreeStore);
  readonly permissionSaveStore = inject(permissionSaveStore);

  private readonly toastr = inject(ToastrHelperService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly destroy$ = new Subject<void>();

  private readonly STORAGE_KEY = 'role_permissions_selection';

  readonly formGroup = this.fb.group({
    userType: [''],
    role: [''],
    search: ['']
  });

  readonly userTypeDropdown = signal<CommonDropdownConfig>(getDropdownConfig('userType', 'Select User Type', []));
  readonly roleDropdown = signal<CommonDropdownConfig>(getDropdownConfig('role', 'Select Role', []));
  readonly searchConfig = signal<CommonTextboxConfig>(
    getTextboxConfig(
      null,
      'search',
      '',
      InputType.text,
      'outline',
      'Search permissions, pages or modules...',
      undefined,
      { icon: 'search' }
    )
  );

  readonly selectedUserTypeId = signal<string>('');
  readonly selectedRoleId = signal<string>('');
  readonly isSaveClicked = signal<boolean>(false);

  // Search state
  readonly searchTerm = signal<string>('');

  // Local state for expanded nodes
  readonly expandedNodes = signal<Record<string, boolean>>({});

  // Pure reactive computed signal for the permission tree with parent references set
  readonly permissionTree = computed(() => {
    const rawTree = (this.permissionTreeStore.data() as RolePermissionTree[]) || [];
    if (rawTree.length > 0) {
      const cloned = rawTree.map(node => this.cloneTree(node));
      const term = this.searchTerm().trim().toLowerCase();

      let filtered = cloned;
      if (term) {
        filtered = cloned
          .map(node => this.filterTree(node, term))
          .filter((node): node is RolePermissionTree => node !== null);
      }

      this.setParentReferences(filtered);
      return filtered;
    }
    return [];
  });

  // Check if any of our stores is loading
  readonly isAnyLoading = computed(() =>
    this.userTypeStore.isLoading() ||
    this.rolesStore.isLoading() ||
    this.permissionTreeStore.isLoading()
  );

  saveBtn = computed<CommonButtonConfig>(() => ({
    ...getButtonConfig(() => this.onSave(), 'flat', 'primary', SYSTEM_CONST.ACTION_BUTTONS.SAVE, true),
    cssClasses: ['btn', 'primary-btn'],
    disabled: !this.selectedRoleId() || this.permissionSaveStore.isSubmitting() || this.isAnyLoading()
  }));

  cancelBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(() => this.onCancel(), 'stroked', 'basic', SYSTEM_CONST.ACTION_BUTTONS.CANCEL, false),
    cssClasses: ['btn', 'secondary-btn']
  });

  private _pendingRoleRestore: string | null = null;
  // Signals used to coordinate the restore flow from constructor effects
  private readonly _savedUserTypeId = signal<string>('');
  private readonly _savedRoleId = signal<string>('');
  private readonly _userTypeRestored = signal<boolean>(false);

  // Snapshot of isAllowed state at the time permissions were loaded — used to detect changes
  private _originalTreeSnapshot: Record<string, boolean> = {};
  // Tracks the previous isLoading state to detect true → false transition (API load complete)
  private _wasLoadingTree = false;

  constructor() {
    // Watch for successful saves — reset snapshot so hasChanges() starts fresh
    effect(() => {
      if (this.permissionSaveStore.isSuccess() && this.isSaveClicked()) {
        this.isSaveClicked.set(false);
        this.permissionSaveStore.clearSuccess();
        // Re-snapshot after save so subsequent edits are compared to the new saved state
        untracked(() => {
          const currentTree = (this.permissionTreeStore.data() as RolePermissionTree[]) || [];
          this._originalTreeSnapshot = {};
          this.snapshotTree(currentTree, this._originalTreeSnapshot);
        });
      }
    }, { allowSignalWrites: true });

    // Watch for API errors across all stores
    effect(() => {
      const err = this.permissionTreeStore.error() ||
        this.userTypeStore.error() ||
        this.rolesStore.error() ||
        this.permissionSaveStore.error();
      if (err) {
        this.toastr.showErrorMessage(err);
        this.permissionTreeStore.clearError();
        this.userTypeStore.clearError();
        this.rolesStore.clearError();
        this.permissionSaveStore.clearError();
      }
    }, { allowSignalWrites: true });

    // Auto-expand tree when permissions are loaded
    effect(() => {
      const tree = this.permissionTree();
      if (tree.length > 0) {
        untracked(() => this.initializeExpandedState(tree));
      }
    }, { allowSignalWrites: true });

    // Update dropdown configurations with fetched store data
    effect(() => {
      const data = this.userTypeStore.data() || [];
      this.userTypeDropdown.update(cfg => ({ ...cfg, data }));
    }, { allowSignalWrites: true });

    effect(() => {
      const data = this.rolesStore.data() || [];
      this.roleDropdown.update(cfg => ({ ...cfg, data }));
    }, { allowSignalWrites: true });

    // Snapshot ONLY when a fresh API load completes (isLoading: true → false).
    // Using a plain boolean (_wasLoadingTree) to detect the transition so that
    // user-driven setData() calls (which don't change isLoading) do NOT overwrite the snapshot.
    effect(() => {
      const isLoading = this.permissionTreeStore.isLoading();
      const rawTree = (this.permissionTreeStore.data() as RolePermissionTree[]) || [];

      if (this._wasLoadingTree && !isLoading) {
        // Transition: was loading → now done → fresh data from API
        untracked(() => {
          this._originalTreeSnapshot = {};
          this.snapshotTree(rawTree, this._originalTreeSnapshot);
        });
      }
      this._wasLoadingTree = isLoading;
    }, { allowSignalWrites: true });

    // ── Restore: Step 1 — once userType data arrives, patch userType dropdown ──
    effect(() => {
      const data = this.userTypeStore.data() as any[];
      const savedId = this._savedUserTypeId();
      if (savedId && data && data.length > 0 && !this._userTypeRestored()) {
        untracked(() => {
          this._userTypeRestored.set(true);
          this.formGroup.controls.userType.setValue(savedId, { emitEvent: true });
        });
      }
    }, { allowSignalWrites: true });

    // ── Restore: Step 2 — once roles data arrives, patch role dropdown ──
    effect(() => {
      const roles = this.rolesStore.data() as any[];
      const pendingRole = this._savedRoleId();
      if (pendingRole && roles && roles.length > 0) {
        untracked(() => {
          const exists = roles.some((r: any) => r.value === pendingRole || r.id === pendingRole);
          if (exists) {
            this._savedRoleId.set(''); // clear so effect doesn't re-fire
            this.formGroup.controls.role.setValue(pendingRole, { emitEvent: true });
          }
        });
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.userTypeStore.resetState();
    this.rolesStore.resetState();
    this.permissionTreeStore.resetState();
    this.permissionSaveStore.resetState();

    this.userTypeStore.getById({
      endpoint: API.ADMIN.USER.ROLE.USERTYPE
    });

    // Restore previously selected user type & role from localStorage
    const saved = this.loadSelection();
    if (saved?.userTypeId) {
      if (saved.roleId) {
        this._savedRoleId.set(saved.roleId);
      }
      this._savedUserTypeId.set(saved.userTypeId);
      // The constructor effects will watch the store signals and patch the form
    }

    // Subscriptions to form control changes
    this.formGroup.controls.userType.valueChanges.pipe(
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.onUserTypeChange(value || '');
    });

    this.formGroup.controls.role.valueChanges.pipe(
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.onRoleChange(value || '');
    });

    this.formGroup.controls.search.valueChanges.pipe(
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.searchTerm.set(value || '');
      this.searchConfig.update(cfg => ({
        ...cfg,
        suffixIcon: value ? {
          icon: 'close',
          click: () => this.formGroup.controls.search.setValue('')
        } : undefined
      }));
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onUserTypeChange(userTypeId: string): void {
    this.selectedUserTypeId.set(userTypeId);
    this.selectedRoleId.set('');
    this.formGroup.controls.role.setValue('', { emitEvent: false });
    this.formGroup.controls.search.setValue('', { emitEvent: false });
    this.rolesStore.setData([]);
    this.permissionTreeStore.setData([]);
    this.expandedNodes.set({});
    this.searchTerm.set('');
    this.searchConfig.update(cfg => ({ ...cfg, suffixIcon: undefined }));
    this.saveSelection(userTypeId, '');

    if (!userTypeId) return;

    this.rolesStore.getById({
      endpoint: API.ADMIN.USER.ROLE.ROLEBYUSERTYPE,
      params: { userTypeId }
    });

    this.permissionTreeStore.getById({
      endpoint: API.ADMIN.USER.ROLE_PERMISSIONS.GET_DEFAULT,
      params: { userTypeId }
    });

    // If a role restore was queued during page restore, wire it up now via signal
    if (this._pendingRoleRestore) {
      this._savedRoleId.set(this._pendingRoleRestore);
      this._pendingRoleRestore = null;
    }
  }


  onRoleChange(roleId: string): void {
    this.selectedRoleId.set(roleId);
    this.expandedNodes.set({});
    this.formGroup.controls.search.setValue('', { emitEvent: false });
    this.searchTerm.set('');
    this.searchConfig.update(cfg => ({ ...cfg, suffixIcon: undefined }));
    this.saveSelection(this.selectedUserTypeId(), roleId);

    if (!roleId) {
      const userTypeId = this.selectedUserTypeId();
      if (userTypeId) {
        this.permissionTreeStore.getById({
          endpoint: API.ADMIN.USER.ROLE_PERMISSIONS.GET_DEFAULT,
          params: { userTypeId }
        });
      } else {
        this.permissionTreeStore.setData([]);
      }
      return;
    }

    this.permissionTreeStore.getWithResult({
      endpoint: API.ADMIN.USER.ROLE_PERMISSIONS.GET_ROLE_BASED,
      params: { roleId }
    }).subscribe({
      next: (data: any) => {
        // If the role has no specific permissions configured yet, load User Type defaults
        if (!data || data.length === 0) {
          const userTypeId = this.selectedUserTypeId();
          if (userTypeId) {
            this.permissionTreeStore.getById({
              endpoint: API.ADMIN.USER.ROLE_PERMISSIONS.GET_DEFAULT,
              params: { userTypeId }
            });
          }
        } else {
          this.permissionTreeStore.setData(data);
        }
      }
    });
  }

  setParentReferences(nodes: RolePermissionTree[], parent?: RolePermissionTree): void {
    for (const node of nodes) {
      (node as any).parent = parent;
      if (node.permissions && node.permissions.length > 0) {
        this.setParentReferences(node.permissions, node);
      }
    }
  }

  initializeExpandedState(nodes: RolePermissionTree[]): void {
    const state = { ...this.expandedNodes() };
    const term = this.searchTerm().trim();
    const traverse = (treeNodes: RolePermissionTree[]) => {
      for (const n of treeNodes) {
        if (n.permissions && n.permissions.length > 0) {
          if (term || state[n.pageId] === undefined) {
            state[n.pageId] = this.hasActions(n); // expand if node has actions, otherwise close
          }
          traverse(n.permissions);
        }
      }
    };
    traverse(nodes);
    this.expandedNodes.set(state);
  }

  filterTree(node: RolePermissionTree, term: string, keepAllDescendants = false): RolePermissionTree | null {
    const nameMatches = node.pageName.toLowerCase().includes(term);
    const shouldKeepAll = keepAllDescendants || nameMatches;

    const filteredChildren: RolePermissionTree[] = [];
    if (node.permissions && node.permissions.length > 0) {
      for (const child of node.permissions) {
        const filteredChild = this.filterTree(child, term, shouldKeepAll);
        if (filteredChild) {
          filteredChildren.push(filteredChild);
        }
      }
    }

    if (nameMatches || filteredChildren.length > 0) {
      const copy = { ...node };
      copy.permissions = shouldKeepAll
        ? (node.permissions ? node.permissions.map(c => this.cloneTree(c)) : [])
        : filteredChildren;
      return copy;
    }

    return null;
  }

  toggleNodeExpand(pageId: string): void {
    this.expandedNodes.update(state => ({
      ...state,
      [pageId]: !state[pageId]
    }));
  }

  isNodeExpanded(pageId: string): boolean {
    return !!this.expandedNodes()[pageId];
  }

  onPermissionToggle(node: RolePermissionTree, isChecked: boolean): void {
    // 1. Adjust relation if it's an action
    if (node.isAction) {
      const parent = (node as any).parent;
      if (parent && parent.permissions) {
        const listPerm = parent.permissions.find((p: any) => p.mnemonic === 'CanList');
        if (listPerm) {
          if (node.mnemonic === 'CanList') {
            if (!isChecked) {
              const anyOtherChecked = parent.permissions.some((p: any) => p.mnemonic !== 'CanList' && p.isAllowed);
              if (anyOtherChecked) {
                // Cannot deselect List permission
                isChecked = true;
              }
            }
          } else {
            if (isChecked) {
              listPerm.isAllowed = true;
            }
          }
        }
      }
    }

    // 2. Update displayed node state immediately
    node.isAllowed = isChecked;
    this.cascadeDescendants(node, isChecked);
    this.cascadeAncestors(node);

    // 3. Persist the changes back to the source-of-truth store tree
    const rawTree = (this.permissionTreeStore.data() as RolePermissionTree[]) || [];
    if (rawTree.length > 0) {
      const rawTreeCloned = rawTree.map(n => this.cloneTree(n));
      this.setParentReferences(rawTreeCloned);

      const targetNode = this.findNodeById(rawTreeCloned, node.pageId);
      if (targetNode) {
        // Apply the same logic on cloned targetNode
        let clonedIsChecked = isChecked;
        if (targetNode.isAction) {
          const parent = (targetNode as any).parent;
          if (parent && parent.permissions) {
            const listPerm = parent.permissions.find((p: any) => p.mnemonic === 'CanList');
            if (listPerm) {
              if (targetNode.mnemonic === 'CanList') {
                if (!clonedIsChecked) {
                  const anyOtherChecked = parent.permissions.some((p: any) => p.mnemonic !== 'CanList' && p.isAllowed);
                  if (anyOtherChecked) {
                    clonedIsChecked = true;
                  }
                }
              } else {
                if (clonedIsChecked) {
                  listPerm.isAllowed = true;
                }
              }
            }
          }
        }

        targetNode.isAllowed = clonedIsChecked;
        this.cascadeDescendants(targetNode, clonedIsChecked);
        this.cascadeAncestors(targetNode);
      }

      this.permissionTreeStore.setData(rawTreeCloned);
    }
  }

  findNodeById(nodes: RolePermissionTree[], id: string): RolePermissionTree | null {
    for (const node of nodes) {
      if (node.pageId === id) {
        return node;
      }
      if (node.permissions && node.permissions.length > 0) {
        const found = this.findNodeById(node.permissions, id);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  cascadeDescendants(node: RolePermissionTree, isChecked: boolean): void {
    if (node.permissions && node.permissions.length > 0) {
      for (const child of node.permissions) {
        child.isAllowed = isChecked;
        this.cascadeDescendants(child, isChecked);
      }
    }
  }

  cascadeAncestors(node: any): void {
    let parent = node.parent;
    while (parent) {
      if (node.isAllowed) {
        parent.isAllowed = true;
      } else {
        const anySiblingChecked = parent.permissions.some((c: any) => c.isAllowed);
        parent.isAllowed = anySiblingChecked;
      }
      node = parent;
      parent = node.parent;
    }
  }

  onSave(): void {
    const roleId = this.selectedRoleId();
    const tree = this.permissionTree();

    if (!roleId) {
      this.toastr.showWarningMessage('Please select a role first');
      return;
    }

    if (tree.length === 0) {
      this.toastr.showWarningMessage('No permissions to save');
      return;
    }

    // Detect if anything actually changed
    if (!this.hasChanges(tree)) {
      this.toastr.showWarningMessage('No changes detected. Please modify permissions before saving.');
      return;
    }

    this.confirmationService.confirm({
      title: 'Save Permissions',
      message: 'Are you sure you want to save the permission changes for this role? This will overwrite the existing configuration.',
      confirmText: 'Yes, Save',
      cancelText: 'Cancel'
    }).subscribe(confirmed => {
      if (!confirmed) return;

      this.isSaveClicked.set(true);

      const firstRootCopy = this.cloneTree(tree[0]);
      const otherRootsCopies = tree.slice(1).map(r => this.cloneTree(r));

      firstRootCopy.permissions = [
        ...(firstRootCopy.permissions || []),
        ...otherRootsCopies
      ];

      const payload = {
        roleId: roleId,
        permissionTree: firstRootCopy
      };

      this.permissionSaveStore.create({
        endpoint: API.ADMIN.USER.ROLE_PERMISSIONS.ADD_UPDATE,
        body: payload as any
      });
    });
  }

  /** Recursively build a flat map of pageId → isAllowed from a tree */
  private snapshotTree(nodes: RolePermissionTree[], snapshot: Record<string, boolean>): void {
    for (const node of nodes) {
      if (node.isAction) {
        snapshot[node.pageId] = !!node.isAllowed;
      }
      if (node.permissions?.length) {
        this.snapshotTree(node.permissions, snapshot);
      }
    }
  }

  /** Returns true if the current tree differs from the original snapshot */
  private hasChanges(nodes: RolePermissionTree[]): boolean {
    for (const node of nodes) {
      if (node.isAction) {
        const original = this._originalTreeSnapshot[node.pageId];
        if (original !== undefined && original !== !!node.isAllowed) {
          return true;
        }
        // New node not in snapshot (newly added permission) counts as a change
        if (original === undefined) {
          return true;
        }
      }
      if (node.permissions?.length && this.hasChanges(node.permissions)) {
        return true;
      }
    }
    return false;
  }

  private saveSelection(userTypeId: string, roleId: string): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ userTypeId, roleId }));
    } catch { }
  }

  private loadSelection(): { userTypeId: string; roleId: string } | null {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  cloneTree(node: RolePermissionTree): RolePermissionTree {
    return {
      pageId: node.pageId,
      pageName: node.pageName,
      pageCode: node.pageCode,
      url: node.url,
      mnemonic: node.mnemonic,
      isAction: node.isAction,
      parentPageId: node.parentPageId,
      userTypeId: node.userTypeId,
      isAllowed: node.isAllowed,
      permissions: node.permissions ? node.permissions.map(c => this.cloneTree(c)) : []
    };
  }

  getModuleStats(node: RolePermissionTree): string {
    let total = 0;
    let allowed = 0;

    if (node.permissions && node.permissions.length > 0) {
      if (node.permissions[0].isAction) {
        total = node.permissions.length;
        allowed = node.permissions.filter(p => p.isAllowed).length;
      } else {
        for (const page of node.permissions) {
          total += page.permissions?.length || 0;
          allowed += page.permissions?.filter(a => a.isAllowed).length || 0;
        }
      }
    }
    return `${allowed}/${total} actions`;
  }

  getPageStats(node: RolePermissionTree): string {
    const total = node.permissions?.length || 0;
    const allowed = node.permissions?.filter(a => a.isAllowed).length || 0;
    return `${allowed}/${total} actions`;
  }

  getPageStatsNumber(node: RolePermissionTree): string {
    const total = node.permissions?.length || 0;
    const allowed = node.permissions?.filter(a => a.isAllowed).length || 0;
    return `${allowed}/${total}`;
  }

  hasActions(node: RolePermissionTree): boolean {
    if (!node.permissions || node.permissions.length === 0) {
      return false;
    }
    if (node.permissions[0].isAction) {
      return true;
    }
    return node.permissions.some(page => page.permissions && page.permissions.length > 0);
  }

  getNodeStatus(node: RolePermissionTree): 'Allowed' | 'Denied' | 'Partial' {
    if (!node.isAllowed) {
      return 'Denied';
    }
    const children = node.permissions || [];
    if (children.length === 0) {
      return node.isAllowed ? 'Allowed' : 'Denied';
    }
    const statuses = children.map(c => this.getNodeStatus(c));
    const allAllowed = statuses.every(s => s === 'Allowed');
    if (allAllowed) {
      return 'Allowed';
    }
    const allDenied = statuses.every(s => s === 'Denied');
    if (allDenied) {
      return 'Denied';
    }
    return 'Partial';
  }

  onCancel(): void {
    this.router.navigate(['/admin/user/roles']);
  }
}
