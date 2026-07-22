import { FormControlBaseConfig } from "../../../models/form-control-base.model";
import { FileExtension } from "../../photo-upload/model/photo-upload.model";

export interface DocumentUploadConfig extends FormControlBaseConfig {
  /** Whether multiple files can be uploaded. Defaults to false (single mode). */
  multiple?: boolean;
  /** Button text shown on the upload trigger. Defaults to 'Change PDF' (single) or 'Add PDF' (multiple). */
  buttonText?: string;
  /** Allowed file extensions (e.g. ['.pdf', '.doc']). */
  allowedExtensions?: FileExtension[];
  /** Callback when a file is viewed */
  onView?: (file: UploadedDocument) => void;
  /** Callback when a file is removed */
  onRemove?: (file: UploadedDocument, index: number) => void;
  /** Callback when a new file is added */
  onAdd?: (file: UploadedDocument) => void;
  /** API endpoint to fetch base64 if not already present */
  viewEndpoint?: string;
  /** Key for the ID when fetching base64 (e.g., 'noticeId') */
  viewParamKey?: string;
  /** Key for the filename control in the parent form (defaults to 'attachmentFileName') */
  fileNameParamKey?: string;
  /** Custom CSS class for the component container */
  customClass?: string;
}

export interface UploadedDocument {
  /** Display file name */
  fileName: string;
  /** Base64-encoded file content (without data-URI prefix) */
  base64: string;
  /** MIME content type */
  contentType: string;
  /** Optional unique identifier (for server-persisted documents) */
  id?: string | number;
}
