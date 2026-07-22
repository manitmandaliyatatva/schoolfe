import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { StarRatingConfig, DEFAULT_STAR_CONFIG } from './models/star-rating.model';
import { ControlContainer, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonErrorComponent } from '../common-error/common-error.component';

@Component({
  selector: 'app-star-rating',
  imports: [CommonModule,CommonErrorComponent,ReactiveFormsModule],
  templateUrl: './star-rating.html',
  styleUrl: './star-rating.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StarRating implements OnInit {
  private controlContainer = inject(ControlContainer);
  /** Configuration input — merged with defaults */
  config = input<StarRatingConfig>({});

  /** Emits the selected rating value */
  ratingChange = output<number>();

  /** Merged config with defaults */
  cfg = computed<Required<StarRatingConfig>>(() => ({
    ...DEFAULT_STAR_CONFIG,
    ...this.config(),
  }));

  /** Current committed rating */
  rating = signal<number>(0);

  /** Index of currently hovered star (-1 = none) */
  hoveredIndex = signal<number>(-1);

  /** Stars array driven by config */
  stars = computed(() => Array.from({ length: this.cfg().total }, (_, i) => i));

  formGroup = signal<FormGroup | null>(null);

  formControlName = () => this.config().formControlName;
  control = () => this.formGroup()?.get(this.formControlName()) ?? null;
  private destroyRef = inject(DestroyRef);


  /** Active display value: hover preview or committed rating */
  activeValue = computed(() => {
    if (this.hoveredIndex() >= 0) {
      return this.cfg().allowHalf
        ? this.hoveredIndex() + 0.5   // hover always shows half when allowHalf
        : this.hoveredIndex() + 1;
    }
    return this.rating();
  });

  /** Formatted label */
  displayRating = computed(() => {
    const v = this.activeValue();
    return v > 0 ? v.toFixed(this.cfg().allowHalf ? 1 : 0) : '—';
  });

  /** Unique ID per instance so gradient IDs don't collide */
  readonly instanceId = Math.random().toString(36).slice(2, 7);
  constructor() {
    // Sync initialValue from config into the rating signal
    effect(() => {
      const initial = this.cfg().initialValue;
      if (initial !== undefined && this.cfg().readonly) {
        this.rating.set(initial);
      }
    });
  }

  ngOnInit(): void {
    this.formGroup.set(this.controlContainer?.control as FormGroup);

    const control = this.control();
    if (!control) return;

    // ✅ Sync whatever value exists right now (non-delayed case)
    if (control.value != null) {
      this.rating.set(control.value);
    }

    // ✅ React to ALL future changes: API patch, patchValue(), setValue(), reset()
    control.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))   // auto-unsubscribe on destroy
      .subscribe((val: number | null) => {
        if (val != null) {
          this.rating.set(val);
        }
      });
  }

  /** Fill percent (0–100) for a given star index */
  getFillPercent(index: number): number {
    const value = this.activeValue();
    const diff = value - index;           // how much of this star is filled
    return Math.round(Math.min(1, Math.max(0, diff)) * 100);
  }

  getStarFill(index: number): string {
    const pct = this.getFillPercent(index);
    if (pct === 0) return 'none';
    if (pct === 100) return this.cfg().filledColor;
    return `url(#half-${this.instanceId}-${index})`;
  }

  getStarStroke(index: number): string {
    return this.getFillPercent(index) > 0
      ? this.cfg().filledColor
      : this.cfg().emptyColor;
  }

  onHover(index: number): void {
    this.hoveredIndex.set(index);
  }

  onLeave(): void {
    this.hoveredIndex.set(-1);
  }

  onSelect(index: number, event: MouseEvent): void {
    let value: number;

    if (this.cfg().allowHalf) {
      const rect = (event.target as SVGElement)
        .closest('button')!
        .getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      value = clickX < rect.width / 2 ? index + 0.5 : index + 1;
    } else {
      value = index + 1;
    }

    // Toggle off if clicking the same value
    const next = this.rating() === value ? 0 : value;
    this.rating.set(next);
    this.ratingChange.emit(next);
    const control = this.control();
    control.setValue(next);
  }
  isError = () => {
    const ctrl = this.control();
    return !!(ctrl?.touched && ctrl?.errors);
  };

  isRequired = () => !!this.control()?.hasValidator(Validators.required);

  errorConfig = () => {
    const control = this.formGroup()?.get(this.formControlName());

    if (!control) return undefined;

    return {
      control,
      formStatus: this.formGroup()?.status ?? null,
      controlName: this.config().label
    };
  };
}
