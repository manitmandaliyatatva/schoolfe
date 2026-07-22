import { Component, inject, computed } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { AuthStore } from '../../../core/store/auth.store';
import { REGEX_CONST } from '../../../core/constants/regex.constant';
import CommonHelper from '../../../core/helpers/common-helper';
import { SYSTEM_CONST } from '../../../core/constants/system.constant';

export interface BreadcrumbItem {
  label: string;
  url: string;
  clickable: boolean;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.scss'
})
export class BreadcrumbComponent {
  private router = inject(Router);
  private titleService = inject(Title);
  private authService = inject(AuthStore);

  private navEnd = toSignal(
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)),
  );

  protected homeUrl = computed(() => {
    this.navEnd();
    if (this.authService.isAdmin()) return '/admin/dashboard';
    if (this.authService.isTeacher()) return '/teacher/dashboard';
    if (this.authService.isStudent()) return '/student/dashboard';
    return '/';
  });

  protected breadcrumbs = computed(() => {
    this.navEnd();

    const rawUrl = this.router.url.split('?')[0];
    const segments = rawUrl.split('/').filter(Boolean);

    let cumulativeUrl = '';
    const items: BreadcrumbItem[] = [];

    segments.forEach((segment, index) => {
      cumulativeUrl += `/${segment}`;

      if (
        segment === 'admin' ||
        segment === 'teacher' ||
        segment === 'student' ||
        segment === 'dashboard'
      ) {
        return;
      }

      if (this.isDynamicParam(segment)) {
        if (items.length > 0) {
          items[items.length - 1].url = cumulativeUrl;
        }
        return;
      }

      const urlPath = cumulativeUrl.split('/').filter(Boolean);
      const matchedRoute = this.findRoute(this.router.config, urlPath);

      let label = '';

      const lowerSegment = segment.toLowerCase();
      if (lowerSegment === 'add') {
        label = SYSTEM_CONST.ACTION_BUTTONS.ADD;
      } else if (lowerSegment === 'edit') {
        label = SYSTEM_CONST.ACTION_BUTTONS.EDIT;
      } else if (lowerSegment === 'view') {
        label = SYSTEM_CONST.ACTION_BUTTONS.VIEW;
      } else {
        const isLast = index === segments.length - 1;
        const isEffectiveLast = segments.slice(index + 1).every((s) => this.isDynamicParam(s));

        if (isLast || isEffectiveLast) {
          if (matchedRoute && !CommonHelper.isEmpty(matchedRoute.title)) {
            const titleParts = this.titleService.getTitle().split('|');
            label = titleParts.length > 1 ? titleParts[1].trim() : titleParts[0].trim();
          }
        } else if (matchedRoute && typeof matchedRoute.title === 'string' && matchedRoute.title !== '') {
          const titleParts = matchedRoute.title.split('|');
          label = titleParts.length > 1 ? titleParts[1].trim() : titleParts[0].trim();
        }

        if (!label) {
          label = this.cleanSegmentName(segment);
        }
      }

      let clickable = false;
      if (matchedRoute) {
        const component = matchedRoute.component || matchedRoute.loadComponent;
        if (component && component.name !== 'MainLayout') {
          clickable = !this.isCollapsibleRoute(matchedRoute);
        }
      }

      items.push({ label, url: cumulativeUrl, clickable });
    });

    return items;
  });

  private findRoute(routes: any[], segments: string[]): any {
    if (!routes || segments.length === 0) return null;

    for (const route of routes) {
      if (route.path === '**') continue;

      if (route.path === '') {
        const children =
          route.children || route._loadedRoutes || route._loadedConfig?.routes;
        if (children) {
          const matchedChild = this.findRoute(children, segments);
          if (matchedChild) {
            return matchedChild;
          }
        }
        continue;
      }

      const routePath = route.path || '';
      const routeSegments = routePath.split('/').filter(Boolean);

      let matches = true;
      const maxLen = Math.max(routeSegments.length, segments.length);
      for (let i = 0; i < maxLen; i++) {
        const routeSeg = routeSegments[i];
        const urlSeg = segments[i];

        if (i < segments.length) {
          if (!routeSeg) {
            break;
          }
          if (!routeSeg.startsWith(':') && routeSeg !== urlSeg) {
            matches = false;
            break;
          }
        } else {
          if (!routeSeg || !routeSeg.startsWith(':')) {
            matches = false;
            break;
          }
        }
      }

      if (matches) {
        const remainingSegments = segments.slice(routeSegments.length);

        if (remainingSegments.length === 0) {
          const emptyPathChild = this.findEmptyPathChild(route);
          return emptyPathChild || route;
        }

        const children = route.children || route._loadedRoutes || route._loadedConfig?.routes;
        if (children) {
          const matchedChild = this.findRoute(children, remainingSegments);
          if (matchedChild) {
            return matchedChild;
          }
        }
      }
    }

    return null;
  }

  private findEmptyPathChild(route: any): any {
    const children = route.children || route._loadedRoutes || route._loadedConfig?.routes;
    if (children) {
      const emptyChild = children.find((c: any) => c.path === '');
      if (emptyChild) {
        const nested = this.findEmptyPathChild(emptyChild);
        return nested || emptyChild;
      }
    }
    return null;
  }

  private isCollapsibleRoute(route: any): boolean {
    if (!route) return false;

    const children = route.children || route._loadedRoutes || route._loadedConfig?.routes;
    if (children && children.length > 0) {
      return children.some((c: any) => c.path === '' && c.redirectTo !== undefined);
    }

    return false;
  }

  private isDynamicParam(segment: string): boolean {
    if (REGEX_CONST.DIGIT.test(segment)) return true;
    if (REGEX_CONST.GUID.test(segment)) return true;

    return false;
  }

  private cleanSegmentName(segment: string): string {
    return segment.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }
}