import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'boolean-status',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './boolean-status.component.html',
  styleUrl: './boolean-status.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BooleanStatusComponent {
  readonly value = input.required<boolean | null | undefined>();
  readonly trueTooltip = input<string>('');
  readonly falseTooltip = input<string>('');
  readonly trueIcon = input<string>('check');
  readonly falseIcon = input<string>('close');
}
