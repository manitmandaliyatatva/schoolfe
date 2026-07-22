import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, computed, inject, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavbarMenuItem } from '../models/navbar-content.model';

@Component({
  selector: 'app-navbar-content',
  imports: [CommonModule, MatIconModule, RouterModule],
  templateUrl: './navbar-content.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './navbar-content.scss',
})
export class NavbarContent {

  private readonly router = inject(Router);

  item = input.required<NavbarMenuItem>();
  collapsed = input<boolean>(false);
  inheritedParentRoute = input<string | undefined>(undefined);
  expandedKey = input<string | undefined>(undefined);
  toggleRequested = output<string | undefined>();

  isFlyoutOpen = signal<boolean>(false);
  expandedChildKey = signal<string | undefined>(undefined);

  // Track current URL reactively to ensure OnPush component updates on navigation
  private readonly currentUrl = toSignal(
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)),
    { initialValue: undefined }
  );

  isToggleMenu = computed<boolean>(() =>
    !!this.item().options?.length
  );

  menuRoute = computed<string | undefined>(() =>
    this.resolveRoute(this.item(), this.inheritedParentRoute())
  );

  childParentRoute = computed<string | undefined>(() =>
    this.menuRoute()
  );

  isExpanded = computed<boolean>(() => {
    if (!this.isToggleMenu()) return false;
    const explicitExpandedKey = this.expandedKey();  
    return explicitExpandedKey === this.item().key;
  });

  onToggle(event: MouseEvent): void {
    event.stopPropagation();

    if (!this.isToggleMenu()) return;

    if (this.collapsed()) {
      return;
    }

    this.toggleRequested.emit(this.isExpanded() ? undefined : this.item().key);
  }

  onNavigate(): void {
    this.isFlyoutOpen.set(false);
  }

  onHoverStart(): void {
    if (!this.collapsed() || !this.isToggleMenu()) return;
    this.isFlyoutOpen.set(true);
  }

  onHoverEnd(): void {
    if (!this.collapsed() || !this.isToggleMenu()) return;
    this.isFlyoutOpen.set(false);
  }

  isItemActive(item: NavbarMenuItem, parentRoute?: string): boolean {
    const currentRoute = this.resolveRoute(item, parentRoute);

    if (currentRoute && this.isRouteActive(currentRoute)) {
      return true;
    }

    return !!item.options?.some(
      child => this.isItemActive(child, currentRoute)
    );
  }

  resolveChildRoute(item: NavbarMenuItem): string {
    return this.resolveRoute(item, this.childParentRoute()) ?? '/';
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.collapsed()) {
      this.isFlyoutOpen.set(false);
    }
  }

  private isRouteActive(route: string): boolean {
    // Re-evaluate whenever currentUrl signal changes
    this.currentUrl();

    const currentPath = this.router.url.split('?')[0].split('#')[0];

    return currentPath === route || currentPath.startsWith(`${route}/`);
  }

  private resolveRoute(
    item: NavbarMenuItem,
    parentRoute?: string
  ): string | undefined {
    const source = item.parentRoute ?? item.route;

    if (!source) return parentRoute;
    if (source.startsWith('/')) return source;
    if (!parentRoute) return `/${source}`;

    return `${parentRoute.replace(/\/+$/, '')}/${source.replace(/^\/+/, '')}`;
  }
}
