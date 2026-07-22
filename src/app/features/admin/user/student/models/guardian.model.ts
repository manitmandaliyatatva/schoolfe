import { createGenericStore } from "../../../../../core/store/resource.store";
import { EmailConfirmation } from "../../../../../core/models/email-validation.model";

export interface Guardian extends EmailConfirmation {
  guardianId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  fullName?: string;
  email: string;
  password?: string | null;
  phoneNumber: string;
  occupation?: string;
  address?: string;
  photo?: string;
  guardianType: number;
  guardianTypeName?: string;
  guardianSubType: number;
  guardianSubTypeName?: string;
  studentId: string;
  userId?: string | null;
  userTypeId?: string | null;
  roleId?: string | null;
  isActAsUser: boolean;
  isActive: boolean;
  isDeleted?: boolean;
  isNew?: boolean;
}

export interface GuardianGridRow extends Guardian {
  rowKey: string;
}

export interface AddEditGuardianDialogData {
  guardian?: GuardianGridRow | null;
  studentId: string;
  existingGuardians?: GuardianGridRow[];
  onSave?: (guardian: Guardian) => void;
}

export const GuardianConst = {
  IS_ACT_AS_USER: 'Is Act As User?',
  INVALID_STUDENT_ID: 'Invalid student id for guardian save.',
  EXISTING_GUARDIAN: 'Existing Guardian',
  USE_EXISTING_GUARDIAN: 'Use Existing Guardian?'
}

export const guardianStore = createGenericStore<Guardian[]>();
export const existingGuardianDetailsStore = createGenericStore<Guardian>();
