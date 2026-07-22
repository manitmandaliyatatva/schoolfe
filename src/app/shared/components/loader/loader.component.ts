import { Component, inject, effect, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoaderService } from '../../../core/services/loader.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <ng-template #loaderTemplate>
      <div class="loader-overlay">
        <mat-spinner diameter="50"></mat-spinner>
      </div>
    </ng-template>
  `,
  styleUrls: ['./loader.scss'],
})
export class LoaderComponent {
  private loader = inject(LoaderService);
  private overlay = inject(Overlay);
  private viewContainerRef = inject(ViewContainerRef);

  @ViewChild('loaderTemplate') loaderTemplate!: TemplateRef<any>;
  private overlayRef?: OverlayRef;

  constructor() {
    effect(() => {
      if (this.loader.isLoading()) {
        this.showLoader();
      } else {
        this.hideLoader();
      }
    });
  }

  private showLoader() {
    if (!this.overlayRef) {
      this.overlayRef = this.overlay.create({
        hasBackdrop: false,
        positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
        scrollStrategy: this.overlay.scrollStrategies.block()
      });
    }

    if (!this.overlayRef.hasAttached() && this.loaderTemplate) {
      const portal = new TemplatePortal(this.loaderTemplate, this.viewContainerRef);
      this.overlayRef.attach(portal);
    }
  }

  private hideLoader() {
    if (this.overlayRef && this.overlayRef.hasAttached()) {
      this.overlayRef.detach();
    }
  }
}
