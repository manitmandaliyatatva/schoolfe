export enum EditorTool {
  // History
  Undo = 'undo',
  Redo = 'redo',
  Separator = '|',

  // View/Source
  SourceEditing = 'sourceEditing',
  ShowBlocks = 'showBlocks',

  // Structure
  Heading = 'heading',
  
  // Font Styling
  FontSize = 'fontSize',
  FontFamily = 'fontFamily',
  FontColor = 'fontColor',
  FontBackgroundColor = 'fontBackgroundColor',

  // Basic Formatting
  Bold = 'bold',
  Italic = 'italic',
  Underline = 'underline',
  Strikethrough = 'strikethrough',
  RemoveFormat = 'removeFormat',

  // Alignment & Lists
  Alignment = 'alignment',
  BulletedList = 'bulletedList',
  NumberedList = 'numberedList',
  Indent = 'indent',
  Outdent = 'outdent',

  // Insertable Elements
  Link = 'link',
  InsertTable = 'insertTable',
  BlockQuote = 'blockQuote',
  CodeBlock = 'codeBlock',
  HorizontalLine = 'horizontalLine',

  // Advanced Styling
  Subscript = 'subscript',
  Superscript = 'superscript',
  Highlight = 'highlight',

  // Productivity
  SpecialCharacters = 'specialCharacters',
  FindAndReplace = 'findAndReplace',
  SelectAll = 'selectAll',
}