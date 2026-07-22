import { createGenericStore } from '../../../../../core/store/resource.store';

export interface ExamType {
  examTypeId: string;
  examTypeName: string;
  examTypeCode: string;
  allowAdmin: boolean;
  allowTeacher: boolean;
  isActive: boolean;
}

export const EXAM_TYPE_CONST = {
  EXAM_TYPE_ID: 'Exam Type ID',
  EXAM_TYPE_NAME: 'Exam Type Name',
  EXAM_TYPE_CODE: 'Exam Type Code',
  ALLOW_ADMIN: 'Allow Admin',
  ALLOW_TEACHER: 'Allow Teacher',
};

export const examTypeStore = createGenericStore<ExamType>();
