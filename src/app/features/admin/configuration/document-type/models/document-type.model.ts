import { createGenericStore } from "../../../../../core/store/resource.store";

export interface DocumentType {
  documentTypeId: string;
  documentTypeName: string;
  userTypeId: string;
  userTypeName?: string;
  isActive: boolean;
}

export const DOCUMENT_TYPE_CONST = {
  DOCUMENT_TYPE_ID: 'Document Type ID',
  DOCUMENT_TYPE_NAME: 'Document Type Name',
};

export const documentTypeStore = createGenericStore<DocumentType>();
