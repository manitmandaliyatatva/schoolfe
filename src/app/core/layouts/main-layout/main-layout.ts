import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd, ActivatedRouteSnapshot } from '@angular/router';
import { Header } from './components/header/header';
import { Navbar } from './components/navbar/navbar';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { AuthStorageService } from '../../services/auth-storage.setvice';
import { BreadcrumbComponent } from '../../../shared/components/breadcrumb/breadcrumb';

@Component({
  selector: 'app-main-layout',
  imports: [Header, Navbar, RouterOutlet, BreadcrumbComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayout implements OnInit {
  private breakPointObserver = inject(BreakpointObserver);
  private router = inject(Router);
  private authStorageService = inject(AuthStorageService);

  isExpanded = signal(true);
  isMobile = signal(false);
  isStudent = computed(() => this.authStorageService.load().usertype === 'Student');
  private readonly activePageTitle = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.getCurrentPageTitle()),
      startWith(this.getCurrentPageTitle())
    ),
    { initialValue: this.getCurrentPageTitle() }
  );

  pageTitle = computed(() => {
    const raw = this.activePageTitle();
    const sep = raw.indexOf(' | ');
    return sep !== -1 ? raw.slice(sep + 3) : raw;
  });

  ngOnInit(): void {
    this.breakPointObserver.observe(['(max-width: 768px)']).subscribe((result) => {
      this.isMobile.set(result.matches);
      this.isExpanded.set(!result.matches);
    });
  }

  toggleSidebar() {
    this.isExpanded.set(!this.isExpanded());
  }

  private getCurrentPageTitle(): string {
    let snapshot: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;

    while (snapshot?.firstChild) {
      snapshot = snapshot.firstChild;
    }

    return snapshot?.title?.toString() || '';
  }
}
