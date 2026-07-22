import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { generateGUID } from '../../../core/helpers/form-utils';
import { ControlContainer, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Editor, NgxEditorModule, Toolbar } from 'ngx-editor';
import { CommonErrorComponent } from '../common-error/common-error.component';
import { CommonTextEditorConfig } from './models/text-editor.model';

@Component({
  selector: 'app-text-editor',
  imports: [CommonModule,
    NgxEditorModule,
    ReactiveFormsModule,
    CommonErrorComponent],
  templateUrl: './text-editor.html',
  styleUrl: './text-editor.scss',
})
export class TextEditor {

  // ── DI ────────────────────────────────────────────────────────────────────
  private controlContainer = inject(ControlContainer);

  // ── Inputs ────────────────────────────────────────────────────────────────
  config = input.required<CommonTextEditorConfig>();
  rowId = input<number>(0);

  // ── Internal Signals ──────────────────────────────────────────────────────
  formGroup = signal<FormGroup | null>(null);
  inputId = signal('');
  isFocused = signal(false);
  rawText = signal('');

  // ── Editor Instance ───────────────────────────────────────────────────────
  editor!: Editor;

  // ── Default Toolbar ───────────────────────────────────────────────────────
  private readonly fullToolbar: Toolbar = [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['link', 'image'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
    ['horizontal_rule', 'format_clear'],
    ['undo', 'redo'],
  ];

  readonly defaultColorPresets: string[] = [
    '#ef4444', '#f97316', '#eab308',
    '#22c55e', '#3b82f6', '#8b5cf6',
    '#ec4899', '#14b8a6', '#64748b', '#000000',
  ];

  // ── Computed Signals ──────────────────────────────────────────────────────
  formControlName = computed(() => this.config().formControlName);

  control = computed(() =>
    this.formGroup()?.get(this.formControlName()) ?? null
  );

  isRequired = computed(() =>
    !!this.control()?.hasValidator(Validators.required)
  );

  isError = computed(() => {
    const ctrl = this.control();
    return !!(ctrl?.touched && ctrl?.errors);
  });

  isDisabled = computed(() => {
    const cfg = this.config();
    if (cfg.disableCallBack) return cfg.disableCallBack(this.rowId());
    return false;
  });

  floatLabel = computed(() => this.config().isFloatLabel !== false);

  isHintText = computed(() => !!this.config().hintText?.trim());

  shouldShowToolbar = computed(() => this.config().showToolbar !== false);

  resolvedToolbar = computed<Toolbar>(() => {
    const t = this.config().toolbar;
    if (!t || t === 'full') return this.fullToolbar;
    if (t === 'minimal') return [['bold', 'italic', 'underline'], ['link']];
    if (t === 'basic') return [['bold', 'italic', 'underline', 'strike'], ['ordered_list', 'bullet_list'], ['link']];
    if (Array.isArray(t)) return t as Toolbar;
    return this.fullToolbar;
  });

  wordCount = computed(() => {
    const t = this.rawText().trim();
    return t ? t.split(/\s+/).filter(Boolean).length : 0;
  });

  charCount = computed(() => this.rawText().length);

  isOverCharLimit = computed(() => {
    const max = this.config().maxLength;
    return max != null && this.charCount() > max;
  });

  themeClass = computed(() => `theme-${this.config().theme ?? 'default'}`);

  errorConfig = computed(() => {
    const control = this.control();
    if (!control) return undefined;
    return {
      control,
      formStatus: this.formGroup()?.status ?? null,
      controlName: this.config().label,
    };
  });

  // ── Constructor ───────────────────────────────────────────────────────────
  constructor() {
    // Sync disabled state with underlying FormControl
    effect(() => {
      const ctrl = this.control();
      if (!ctrl) return;
      if (this.isDisabled()) ctrl.disable();
      else ctrl.enable();
    });
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.inputId.set(generateGUID(this.config().formControlName));
    this.formGroup.set(this.controlContainer.control as FormGroup);

    this.editor = new Editor({
      history: true,
      keyboardShortcuts: true,
    });

    // Keep rawText in sync for word/char count
    this.control()?.valueChanges.subscribe((val: string | null) => {
      const html = val ?? '';
      this.rawText.set(html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' '));
    });
  }

  ngOnDestroy(): void {
    this.editor.destroy();
  }

  // ── Event Handlers ────────────────────────────────────────────────────────
  onFocus(): void {
    this.isFocused.set(true);
  }

  onBlur(event: FocusEvent): void {
    this.isFocused.set(false);

    // If the editor only contains whitespace HTML (e.g. "<p> </p>"), clear it
    const ctrl = this.control();
    if (ctrl) {
      const stripped = (ctrl.value ?? '').replace(/<[^>]*>/g, '').trim();
      if (!stripped) ctrl.setValue('');
      ctrl.markAsTouched();
    }

    this.config().blur?.(event, this.rowId());
  }

  onChange(event: Event): void {
    this.config().change?.(event, this.rowId());
  }
}
