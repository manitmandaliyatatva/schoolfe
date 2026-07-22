import { Component, computed, inject, input, OnInit } from '@angular/core';
import { ControlContainer, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { ClassicEditor, Essentials, Paragraph, TableToolbar } from 'ckeditor5';

import 'ckeditor5/ckeditor5.css';
import { EditorTool } from './enum/rich-text-editor.enum';
import { PLUGIN_MAP } from './enum/rich-text-editor.plugin';

const BASE_PLUGINS = [
  Essentials,
  Paragraph,
  TableToolbar, // Add this to base so tables are always manageable
];

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [CKEditorModule, ReactiveFormsModule],
  viewProviders: [
    {
      provide: ControlContainer,
      useFactory: () => inject(ControlContainer, { skipSelf: true }),
    },
  ],
  templateUrl: './rich-text-editor.html',
  styles: [
    `
      :host ::ng-deep .ck-editor__editable_inline {
        min-height: 200px;
      }
    `,
  ],
})
export class AppRichTextEditor implements OnInit {
  readonly DEFAULT_TOOLBAR: (EditorTool | string)[] = [
    EditorTool.Undo,
    EditorTool.Redo,
    EditorTool.Separator,
    EditorTool.SourceEditing,
    EditorTool.Separator,
    EditorTool.Heading,
    EditorTool.Separator,
    EditorTool.FontSize,
    EditorTool.FontFamily,
    EditorTool.FontColor,
    EditorTool.FontBackgroundColor,
    EditorTool.Separator,
    EditorTool.Bold,
    EditorTool.Italic,
    EditorTool.Underline,
    EditorTool.Strikethrough,
    EditorTool.RemoveFormat,
    EditorTool.Separator,
    EditorTool.Alignment,
    EditorTool.BulletedList,
    EditorTool.NumberedList,
    EditorTool.Outdent,
    EditorTool.Indent,
    EditorTool.Separator,
    EditorTool.Link,
    EditorTool.InsertTable,
    EditorTool.BlockQuote,
    EditorTool.CodeBlock,
    EditorTool.HorizontalLine,
    EditorTool.Separator,
    EditorTool.Subscript,
    EditorTool.Superscript,
    EditorTool.Highlight,
    EditorTool.Separator,
    EditorTool.SpecialCharacters,
    EditorTool.FindAndReplace,
    EditorTool.SelectAll,
  ];
  controlName = input.required<string>();
  label = input<string>('');
  customToolbar = input<string[]>();

  public editorConfig = computed(() => {
    const activeToolbar = this.customToolbar() ?? this.DEFAULT_TOOLBAR;

    const pluginEntries = activeToolbar
      .map((tool) => PLUGIN_MAP[tool])
      .filter((entry) => entry !== undefined);

    const dynamicPlugins = pluginEntries.flat().filter((p) => typeof p === 'function');

    const finalPlugins = Array.from(new Set([...BASE_PLUGINS, ...dynamicPlugins]));

    return {
      licenseKey: 'GPL',
      plugins: finalPlugins,
      toolbar: activeToolbar,
      placeholder: `Enter ${this.label() || 'content'}...`,
      table: {
        contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'],
      },
    };
  });

  public Editor = ClassicEditor;
  public parentForm!: FormGroup;
  private readonly controlContainer = inject(ControlContainer);

  ngOnInit() {
    this.parentForm = this.controlContainer.control as FormGroup;
  }
}
