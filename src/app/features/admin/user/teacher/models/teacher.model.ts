import { createGenericStore } from "../../../../../core/store/resource.store";
import { EmailConfirmation } from "../../../../../core/models/email-validation.model";

export interface Teacher extends EmailConfirmation {
  teacherId: string;
  userId: string;
  userTypeId: string;
  roleId: string;
  teacherCode: string;
  firstName: string;
  middleName: string;
  lastName: string;
  fullName: string;
  email: string;
  password?: string;
  classSubjectId: string;
  classSubjectName?: string;
  contractType: number;
  shift: number;
  workLocation: string;
  gender: number;
  dob: Date | string;
  phoneNumber: string;
  photo: string;
  joiningDate: Date | string;
  experienceYears: number;
  currentAddress: string;
  permanentAddress: string;
  isActive: boolean;
  isUserDeleted?: boolean;
  photoName?: string;
  isPhotoReplaced?: boolean;
  genderName?: string;
  contractTypeName?: string;
  shiftName?: string;
}

export const TEACHER_CONST = {
  IMPORT_TEACHERS: 'Import Teachers',
  INVALID_TEACHER_ID: 'Invalid teacher ID.',
  YEAR_ONLY: 'Passing Year must be exactly 4 digits.'
};

export interface TeacherQualification {
  teacherQualificationId?: string | null;
  teacherId?: string | null;
  qualification: string;
  passingYear: string;
  institutionName: string;
  universityName: string;
  isPercentage: boolean;
  marks: number;
  isActive?: boolean;
  isNew?: boolean;
}

export interface TeacherQualificationGridRow extends TeacherQualification {
  rowKey: string;
}

export interface AddEditTeacherQualificationDialogData {
  teacherId: string;
  qualification: TeacherQualificationGridRow;
  onSave?: (result: TeacherQualification) => void;
}

export const teacherStore = createGenericStore<Teacher>();
export const teacherQualificationsStore = createGenericStore<TeacherQualification[]>();