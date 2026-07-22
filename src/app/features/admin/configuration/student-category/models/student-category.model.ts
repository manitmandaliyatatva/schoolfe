import { createGenericStore } from "../../../../../core/store/resource.store";

export interface StudentCategory {
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  isActive: boolean;
}

export const STUDENT_CATEGORY_CONST = {
  CATEGORY_ID: 'Category ID',
  CATEGORY_NAME: 'Category Name',
  CATEGORY_CODE: 'Category Code',
};

export const studentCategoryStore = createGenericStore<StudentCategory>();
