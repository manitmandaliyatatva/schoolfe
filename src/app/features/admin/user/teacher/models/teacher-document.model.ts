import { createGenericStore } from '../../../../../core/store/resource.store';

export interface TeacherDocument {
  teacherDocumentId: string;
  teacherId: string;
  documentTypeId: string;
  documentTypeName: string;
  documentName: string;
  document: string | null;
  documentPath: string | null;
  isActive: boolean;
  isDeleted: boolean;
}

export interface TeacherDocumentBase64 {
  fileName: string;
  contentType: string;
  base64: string;
}

export const teacherDocumentStore = createGenericStore<TeacherDocument[]>();

export const teacherDocumentBase64Store = createGenericStore<TeacherDocumentBase64>();
