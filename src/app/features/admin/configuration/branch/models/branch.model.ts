import { createGenericStore } from "../../../../../core/store/resource.store";

export interface Branch {
  branchId?: string;
  branchCode: string;
  branchName: string;
  address?: string;
  landMark: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

export const BRANCH_CONST = {
  BRANCH_ID: 'Branch ID',
  BRANCH_CODE: 'Code',
  BRANCH_NAME: 'Branch Name',
  ADDRESS: 'Address',
  LANDMARK: 'Land Mark',
  CITY: 'City',
  STATE: 'State',
  COUNTRY: 'Country',
  PHONE: 'Contact Number',
  EMAIL: 'Email',
  BRANCH_DETAILS: 'Branch Details'
};

export const branchStore = createGenericStore<Branch>();
