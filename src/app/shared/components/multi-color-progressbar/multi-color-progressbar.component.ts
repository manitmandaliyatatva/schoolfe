import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProgressSegment } from './model/multi-color-progressbar.model';

@Component({
  selector: 'app-multi-color-progressbar',
  standalone: true,
  imports: [CommonModule, MatTooltipModule],
  templateUrl: './multi-color-progressbar.component.html',
  styleUrl: './multi-color-progressbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MultiColorProgressbarComponent {
  readonly segments = input.required<ProgressSegment[]>();
  readonly total = input.required<number>();
}
