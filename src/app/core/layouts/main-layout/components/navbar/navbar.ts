import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../../../store/auth.store';
import { MenuPermissionStore } from '../../../../store/menu-permission.store';
import { NavbarMenuItem } from './models/navbar-content.model';
import { NavbarContent } from './navbar-content/navbar-content';
import { PageDto } from '../../../../models/menu-permission.model';
import { ICON_MAPPING } from '../../../../constants/system.constant';
import { MaterialModule } from "../../../../modules/material/material.module";
import { TITLES } from '../../../../../shared/constants/title.constant';
import { compareUserType, UserTypeConst } from '../../../../../shared/constants/user-type.constants';
import CommonHelper from '../../../../helpers/common-helper';
import { PublicSettingStore } from '../../../../store/public-setting.store';
@Component({
  selector: 'app-navbar',
  imports: [CommonModule, NavbarContent, MaterialModule],
  templateUrl: './navbar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './navbar.scss',
})
export class Navbar {
  expanded = input<boolean>(true);
  collapsed = input<boolean>(false);
  vertical = input<boolean>(false);
  private router = inject(Router);
  private auth = inject(AuthStore);
  readonly titleConst = TITLES;
  public settingStore = inject(PublicSettingStore);

  readonly menuItems = signal<NavbarMenuItem[]>([]);
  readonly expandedMenuKey = signal<string | undefined>(undefined);
  menuStore = inject(MenuPermissionStore);

  constructor() {
    effect(() => {
      if (this.menuStore.list()) {
        this.transformApiToMenuConfig(this.menuStore.list().pageDtos);
        this.expandActiveParentMenu();
      }
    })

  }

  clearMenu(): void {
    this.menuItems.set([]);
  }
  transformApiToMenuConfig = (menu: PageDto[]) => {
    const role = this.auth.usertype();
    let userMenu;
    if (this.auth.isSuperAdmin()) {
      const baseMenu = menu.filter(item =>
        compareUserType(item.userTypeId, role.replace(/\s+/g, ''))
      );

      const extraMenu = menu.filter(item =>
        compareUserType(UserTypeConst.Admin, 'Admin')
      );

      userMenu = [...baseMenu, ...extraMenu]
        .filter((item, index, self) =>
          index === self.findIndex(x => x.pageId === item.pageId)
        );
    } else {
      userMenu = menu.filter(item => compareUserType(item.userTypeId, role.replace(/\s+/g, ''))
        && (item.pageCode != 'S_PROFILE' && item.pageCode != 'T_PROFILE'));
    }
    let updatedMenu = [];
    const parentMenu = userMenu.filter(item => CommonHelper.isEmptyGuid(item.parentPageId));

    parentMenu.forEach((parent, index) => {
      const allChild = userMenu.filter(item => CommonHelper.compareGuid(item.parentPageId, parent.pageId));
      allChild.sort((a, b) => a.sortOrder - b.sortOrder);
      const menu = {
        key: parent.pageCode,
        label: parent.pageName,
        icon: ICON_MAPPING[parent.pageCode],
        route: parent.url,
        sort: parent.sortOrder,
        options: []
      }
      allChild.forEach(child => {
        const childMenu = {
          key: child.pageCode,
          label: child.pageName,
          route: child.url,
          sort: child.sortOrder
        }
        menu.options.push(childMenu)
      })
      updatedMenu.push(menu);
    });

    updatedMenu = updatedMenu.sort((a,b) => a.sort - b.sort);
    this.menuItems.set(updatedMenu);
  }

  private expandActiveParentMenu(): void {
    const currentUrl = this.router.url;
    const menuItems = this.menuItems();

    for (const parent of menuItems) {
      if (parent.options && parent.options.length > 0) {
        const hasActiveChild = parent.options.some(child => 
          child.route && currentUrl.includes(child.route)
        );
        if (hasActiveChild) {
          this.expandedMenuKey.set(parent.key);
          break;
        }
      }
    }
  }
}
