import { createGenericStore } from '../../../../../core/store/resource.store';

export interface TeacherOtherDetails {
  teacherOtherDetailId: string | null;
  teacherId: string | null;
  bloodGroup: string;
  height: number | null;
  weight: number | null;
  bankAccountNumber: string;
  bankName: string;
  ifscCode: string;
  nationalIdentificationNumber: string;
  previousSchoolName: string;
  previousSchoolAddress: string;
  isActive: boolean;
}

export const teacherOtherDetailsStore = createGenericStore<TeacherOtherDetails>();
