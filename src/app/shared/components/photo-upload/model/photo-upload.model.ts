import { FormControlBaseConfig } from "../../../models/form-control-base.model";

export type FileType = "file" | "image";

export const FILE_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
  '.pdf',                                             
  '.doc', '.docx',                                        
] as const;

export type FileExtension = typeof FILE_EXTENSIONS[number];

export interface CommonPhotoUploadConfig extends FormControlBaseConfig {
  altText?: string;
  change?(base64: string, fileName?: string): void;
  fileNameControlName?: string;
  onView?(): void;
  onDownload?(): void;
  onDelete?(): void;
  fileType?: FileType;
  allowedExtensions?: FileExtension[];
}

export const PHOTO_UPLOAD_CONST = {
  DISPLAY_FILE_NAME: 'Uploaded file',
  UPLOAD_LABEL: 'Upload Attachment',
  HELPER_TEXT: {
    REPLACE: 'Upload a new file to replace the current attachment, or leave empty to keep the existing one.',
    DRAG_DROP: 'Drag & drop a file here or click to browse.'
  }
} as const;
