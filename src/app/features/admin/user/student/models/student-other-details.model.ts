import { createGenericStore } from '../../../../../core/store/resource.store';

export interface StudentOtherDetails {
  studentOtherDetailId: string;
  studentId: string;
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

export const studentOtherDetailsStore = createGenericStore<StudentOtherDetails>();

