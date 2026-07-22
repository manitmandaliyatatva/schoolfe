import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { PublicSettingStore } from '../../store/public-setting.store';

@Component({
  selector: 'app-auth-layout',
  imports: [CommonModule, RouterOutlet, MatCardModule],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.scss',
})
export class AuthLayout {
  private readonly router = inject(Router);
  protected publicStore = inject(PublicSettingStore);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  authIllustration = computed(() =>
    this.currentUrl().includes('forgot-password') ? 'reset-password.png' : 'login.png'
  );
}
