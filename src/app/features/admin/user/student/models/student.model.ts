import { createGenericStore } from "../../../../../core/store/resource.store";
import { EmailConfirmation } from "../../../../../core/models/email-validation.model";

export interface Student extends EmailConfirmation {
  studentId: string;
  userId: string;
  userTypeId: string;
  roleId: string;
  classSectionId: string;
  classSectionName?: string;
  rollNumber: number;
  admissionNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName?: string;
  categoryId: string;
  categoryName?: string;
  gender: string;
  dob: Date | string;
  phoneNumber: string;
  photo: string;
  admissionDate: Date | string;
  currentAcademicYearId: string;
  email: string;
  password?: string;
  isSuspended: boolean;
  currentAddress: string;
  permanentAddress: string;
  isActive: boolean;
  isUserDeleted?: boolean;
  photoName?: string;
  isPhotoReplaced?: boolean;
  genderName?: string;
}

export const studentStore = createGenericStore<Student>();

export const STUDENT_CONST = {
  IMPORT_STUDENTS: 'Import Students'
};
