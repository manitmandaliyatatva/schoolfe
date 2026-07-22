import { StatusChipConfig } from '../../status-chip/status-chip.model';

export interface ViewDetail {
  label: string;
  value: string | number | Date | null | undefined;
  isDate?: boolean;
  isPhone?: boolean;
}

export interface GuardianViewDetail {
  title: string;
  details: ViewDetail[];
}

export interface ActionButton {
  label: string;
  icon: string;
  callback: () => void;
  cssClass?: string;
  isHidden?: boolean;
}

export interface UserViewTab {
  label: string;
  cards: {
    title: string;
    details: ViewDetail[];
  }[];
}

export interface UserViewData {
  title: string;
  photo?: string;
  fullName: string;
  code: string;
  codeLabel: string;
  statusChips?: StatusChipConfig[];
  actionButtons?: ActionButton[];
  
  personalInfo: ViewDetail[];
  academicInfoTitle: string;
  academicInfo: ViewDetail[];
  addressInfo: ViewDetail[];
  
  otherDetails: {
    previousSchool?: ViewDetail[];
    profile?: ViewDetail[];
    bank?: ViewDetail[];
  } | null;
  
  guardians?: GuardianViewDetail[];
  
  additionalTabs?: UserViewTab[];
  
  documents: { id: string; typeName: string; fileName?: string | null }[];

  // Callbacks
  onBack?: () => void;
  onDownload?: (id: string) => void;
  onView?: (id: string) => void;
}

export interface UserViewLabels {
  backButton?: string;
  editButton?: string;
  otherDetailsTab?: string;
  documentsTab?: string;
  guardiansTab?: string;
}
