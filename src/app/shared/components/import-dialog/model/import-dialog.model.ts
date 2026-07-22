import { createGenericStore } from "../../../../core/store/resource.store";

export interface ImportDialogData {
  title?: string;
  sampleFileEndpoint?: string;
  endpoint: string;
  queryParams?: any;
}

export interface ImportFileDto {
  fileBase64: string;
  originalFileWithError: string;
  isSuccess: boolean;
}
export const importFileStore = createGenericStore<ImportFileDto>();

export const ImportDialogConsts = {
  IMPORT_FAILED: 'Import failed.',
  DOWNLOAD_ERROR_FILE: 'Download Error File',
  DEFAULT_IMPORT_FILE_NAME: 'Import.xlsx',
  ERROR_FILE_PREFIX: 'Error_',
  UPLOAD_TITLE: 'Upload file or drag and drop it here',
  FILE_TYPE: 'File',
  CHOOSE_FILE: 'Choose a file',
  NO_FILE_CHOSEN: 'No file chosen',
  DOWNLOAD_SAMPLE_PREFIX: 'Download',
  SAMPLE_FILE_LINK: 'Sample File',
  INVALID_FILE_TYPE: 'Invalid file type. Please select a valid file.',
  GUIDANCE_TITLE: 'Import Guidelines:',
  GUIDANCE_HEADERS: 'Please do not modify or remove the headers in the sample file.',
  GUIDANCE_DATE_FORMAT: 'Ensure dates are formatted correctly (e.g., DD/MM/YYYY).',
  GUIDANCE_FILE_TYPE: 'Only .xls and .xlsx files are supported.'
};