import { Toolbar } from 'ngx-editor';

// ── Theme Options ─────────────────────────────────────────────────────────────
export type TextEditorTheme = 'default' | 'dark' | 'minimal' | 'warm';

// ── Toolbar Presets ───────────────────────────────────────────────────────────
export type ToolbarPreset = 'minimal' | 'basic' | 'full' | Toolbar;

// ── Main Config Interface ─────────────────────────────────────────────────────
export interface CommonTextEditorConfig {
  /**
   * FormControl name — must match the key in the parent FormGroup.
   */
  formControlName: string;

  /**
   * Label displayed above the editor (also used in error messages).
   */
  label?: string;

  /**
   * Short description or subtitle shown below the label.
   */
  description?: string;

  /**
   * Placeholder text shown when the editor is empty.
   * @default 'Start typing...'
   */
  placeholder?: string;

  /**
   * Visual theme of the editor.
   * @default 'default'
   */
  theme?: TextEditorTheme;

  /**
   * Toolbar preset or custom Toolbar array.
   * - 'minimal'  → Bold, Italic, Underline, Link
   * - 'basic'    → + Strike, Lists
   * - 'full'     → All toolbar options (default)
   * - Toolbar[]  → Custom ngx-editor Toolbar array
   */
  toolbar?: ToolbarPreset;

  /**
   * Whether to display the toolbar.
   * @default true
   */
  showToolbar?: boolean;

  /**
   * Show word count in the footer.
   */
  showWordCount?: boolean;

  /**
   * Show character count in the footer.
   */
  showCharCount?: boolean;

  /**
   * Maximum allowed characters. Triggers error state if exceeded.
   */
  maxLength?: number;

  /**
   * Minimum height of the editor content area.
   * @default '150px'
   */
  minHeight?: string;

  /**
   * Maximum height of the editor content area.
   * @default 'none'
   */
  maxHeight?: string;

  /**
   * Hint text shown below editor when no error is present.
   */
  hintText?: string;

  /**
   * Whether the label floats (matches Angular Material behaviour).
   * @default true
   */
  isFloatLabel?: boolean;

  /**
   * Custom color presets for the toolbar color picker.
   */
  colorPresets?: string[];

  /**
   * Disable callback — receives rowId and returns boolean.
   * Matches the same pattern used in TextboxComponent.
   */
  disableCallBack?: (rowId: number) => boolean;

  /**
   * Change event callback.
   */
  change?: (event: Event, rowId: number) => void;

  /**
   * Blur event callback.
   */
  blur?: (event: FocusEvent, rowId: number) => void;
}