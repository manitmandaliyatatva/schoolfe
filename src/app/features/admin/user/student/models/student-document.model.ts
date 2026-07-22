import { createGenericStore } from '../../../../../core/store/resource.store';

export interface StudentDocument {
  studentDocumentId: string;
  studentId: string;
  documentTypeId: string;
  documentTypeName: string;
  documentName: string;
  document: string | null;
  documentPath: string | null;
  isActive: boolean;
  isDeleted: boolean;
}

export interface StudentDocumentBase64 {
  fileName: string;
  contentType: string;
  base64: string;
}

export const studentDocumentStore = createGenericStore<StudentDocument[]>();

export const studentDocumentBase64Store = createGenericStore<StudentDocumentBase64>();
