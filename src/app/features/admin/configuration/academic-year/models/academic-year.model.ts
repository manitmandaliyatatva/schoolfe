import { createGenericStore } from "../../../../../core/store/resource.store";
import { DropdownOption } from "../../../../../shared/models/Dropdown.model";

export interface AcademicYear {
  academicYearId: string;
  academicYearName: string;
  academicYearCode: string;
  startDate: Date | string | null;
  endDate: Date | string | null;
  isActive: boolean;
  isCurrentAcademicYear: boolean;
}

export interface AcademicYearDropdown extends DropdownOption {
  isCurrent: boolean;
}

export const ACADEMIC_YEAR_CONST = {
  ACADEMIC_YEAR_ID: 'Academic Year ID',
  ACADEMIC_YEAR_NAME: 'Academic Year Name',
  ACADEMIC_YEAR_CODE: 'Academic Year Code',
  IS_CURRENT_ACADEMIC_YEAR: 'Is Current Academic Year',
  VALIDATION_ERROR: 'Validation Error',
  CURRENT_CANNOT_BE_INACTIVE: 'Current academic year cannot be inactive.',
  CURRENT_CANNOT_BE_REMOVED: 'Current academic year status cannot be removed directly. Please set another academic year as current.',
  SET_AS_CURRENT: 'Set As Current',
  CONFIRM_SET_AS_CURRENT: (name: string) => `Are you sure you want to set '${name}' as the current academic year?`
};

export const academicYearStore = createGenericStore<AcademicYear>();
