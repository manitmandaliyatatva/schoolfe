import { TITLES } from "../../../../../../shared/constants/title.constant";

export type IconType = 'material' | 'image';

export interface NavbarMenuItem {
  key: string;
  label: string;
  icon?: string;
  iconType?: IconType;
  route?: string;
  parentRoute?: string;
  sort?: number;
  options?: NavbarMenuItem[];
}

export const MENU_CONFIG: Record<string, NavbarMenuItem[]> = {

  Admin: [
    {
      key: 'dashboard',
      label: TITLES.ADMIN.DASHBOARD,
      icon: 'ic-dashboard.svg',
      iconType: 'image',
      route: 'admin/dashboard',
    },
    {
      key: 'admin',
      label: TITLES.CONFIGURATION.ADMIN_CONFIGURATION,
      icon: 'supervisor_account',
      iconType: 'material',
      options: [
        {
          key: 'user',
          label: TITLES.USER.USERS,
          route: 'admin/configuration/users'
        },
        {
          key: 'document-type',
          label: TITLES.CONFIGURATION.DOCUMENT_TYPE,
          route: 'admin/configuration/document-types',
        },
        {
          key: 'role',
          label: TITLES.USER.ROLE,
          route: 'admin/configuration/roles',
        },
        {
          key: 'student-category',
          label: TITLES.CONFIGURATION.STUDENT_CATEGORY,
          route: 'admin/configuration/student-categories',
        },
      ]
    },
    {
      key: 'classes',
      label: TITLES.CLASS,
      icon: 'menu_book',
      iconType: 'material',
      route: 'admin/class',
      options: [
        {
          key: 'section',
          label: TITLES.SECTION,
          route: 'section',
        },
        {
          key: 'subject',
          label: TITLES.SUBJECT,
          route: 'subject',
        },
        {
          key: 'class',
          label: TITLES.CLASS,
          route: 'class',
        },
        {
          key: 'subject-allocation',
          label: TITLES.SUBJECT_ALLOCATION,
          route: 'subject-allocation',
        },
      ],
    },
  ],

  Student: [
    {
      key: 'dashboard',
      label: TITLES.STUDENT.DASHBOARD,
      icon: 'ic-dashboard.svg',
      iconType: 'image',
      route: 'student/dashboard',
    }
  ],

  Teacher: [
    {
      key: 'dashboard',
      label: TITLES.TEACHER.DASHBOARD,
      icon: 'ic-dashboard.svg',
      iconType: 'image',
      route: 'teacher/dashboard',
    }
  ],

};
