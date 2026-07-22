import {
  Undo,
  Highlight as CkHighlight,
  SourceEditing,
  SelectAll,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  RemoveFormat,
  Subscript,
  Superscript,
  Heading,
  FontSize,
  FontFamily,
  FontColor,
  FontBackgroundColor,
  Alignment,
  List,
  Indent,
  IndentBlock,
  Link,
  Table,
  BlockQuote,
  CodeBlock,
  HorizontalLine,
  FindAndReplace,
  SpecialCharacters,
  SpecialCharactersEssentials,
  TableToolbar,
} from 'ckeditor5';
import { EditorTool } from './rich-text-editor.enum';

export const PLUGIN_MAP: Record<string, any> = {
  // Logic/Essentials
  [EditorTool.Undo]: Undo,
  [EditorTool.Redo]: Undo,
  [EditorTool.SourceEditing]: SourceEditing,
  [EditorTool.SelectAll]: SelectAll,

  // Text Styles
  [EditorTool.Bold]: Bold,
  [EditorTool.Italic]: Italic,
  [EditorTool.Underline]: Underline,
  [EditorTool.Strikethrough]: Strikethrough,
  [EditorTool.RemoveFormat]: RemoveFormat,
  [EditorTool.Subscript]: Subscript,
  [EditorTool.Superscript]: Superscript,
  [EditorTool.Highlight]: CkHighlight,

  // Structure & Fonts
  [EditorTool.Heading]: Heading,
  [EditorTool.FontSize]: FontSize,
  [EditorTool.FontFamily]: FontFamily,
  [EditorTool.FontColor]: FontColor,
  [EditorTool.FontBackgroundColor]: FontBackgroundColor,

  // Paragraphs & Lists
  [EditorTool.Alignment]: Alignment,
  [EditorTool.BulletedList]: List,
  [EditorTool.NumberedList]: List,

  // Insertables
  [EditorTool.Link]: Link,
  [EditorTool.BlockQuote]: BlockQuote,
  [EditorTool.CodeBlock]: CodeBlock,
  [EditorTool.HorizontalLine]: HorizontalLine,
  [EditorTool.FindAndReplace]: FindAndReplace,
  [EditorTool.SpecialCharacters]: [SpecialCharacters, SpecialCharactersEssentials],
  [EditorTool.InsertTable]: [Table, TableToolbar],
  [EditorTool.Indent]: [Indent, IndentBlock],
  [EditorTool.Outdent]: [Indent, IndentBlock],
};
