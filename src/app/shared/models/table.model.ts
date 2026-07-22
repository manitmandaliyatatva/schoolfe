import { ListDisplayType } from '../Enums/table.enum';

export interface BadgeConfig {
  mappings: BadgeConfigItem[];
}

export interface BadgeConfigItem {
  value: string;
  label: string;
  color: string;
}

export interface ListColumnConfig {
  key: string;
  label: string;
  sortable?: boolean;
  displayType?: ListDisplayType;
  format?: string | null;
  badgeConfig?: BadgeConfig;
}
