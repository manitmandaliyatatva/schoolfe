import { ChangeDetectionStrategy, Component, effect, OnDestroy, inject, input, signal } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import FileHelper from '../../helpers/file.helper';
import { SafeImageConfig } from './model/safe-image.model';

@Component({
  selector: 'app-safe-image',
  standalone: true,
  templateUrl: './safe-image.component.html',
  styleUrl: './safe-image.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SafeImageComponent implements OnDestroy {
  config = input.required<SafeImageConfig>();

  private readonly sanitizer = inject(DomSanitizer);
  readonly safeSrc = signal<SafeUrl | string>('');
  readonly showInitials = signal<boolean>(false);
  readonly initials = signal<string>('');
  private currentBlobUrl: string | null = null;
  private hasFailed = false;

  constructor() {
    effect((onCleanup) => {
      const src = this.config().src;
      const userName = this.config().userName;
      const defaultImage = this.config().defaultImage || 'user-default.png';

      this.hasFailed = false;
      this.showInitials.set(false);

      if (this.currentBlobUrl) {
        URL.revokeObjectURL(this.currentBlobUrl);
        this.currentBlobUrl = null;
      }

      const url = FileHelper.getPhotoUrl(src);
      if (!url) {
        if (userName) {
          this.initials.set(this.getInitials(userName));
          this.showInitials.set(true);
        } else {
          this.safeSrc.set(defaultImage);
        }
        this.hasFailed = true;
        return;
      }

      if (url.startsWith('blob:')) {
        this.currentBlobUrl = url;
      }

      this.safeSrc.set(this.sanitizer.bypassSecurityTrustUrl(url));

      onCleanup(() => {
        if (this.currentBlobUrl) {
          URL.revokeObjectURL(this.currentBlobUrl);
          this.currentBlobUrl = null;
        }
      });
    }, { allowSignalWrites: true });
  }

  private getInitials(name: string): string {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  onError(): void {
    if (this.hasFailed) return;
    this.hasFailed = true;
    const userName = this.config().userName;
    if (userName) {
      this.initials.set(this.getInitials(userName));
      this.showInitials.set(true);
    } else {
      this.safeSrc.set(this.config().defaultImage || 'user-default.png');
    }
  }

  ngOnDestroy(): void {
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
  }
}
