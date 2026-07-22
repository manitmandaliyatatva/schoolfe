import { createGenericStore } from "../../../../../core/store/resource.store";

export interface ClassSubject {
  classSubjectId: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  isActive: boolean;
}

export const CLASS_SUBJECT_CONST = {
  CLASS_SUBJECT_ID: 'Class Subject ID',
};

export const classSubjectStore = createGenericStore<ClassSubject>();
