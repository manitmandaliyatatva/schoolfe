import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { HttpService } from '../services/http.service';
import { API } from '../../shared/constants/api-url';
import { ApiResponse } from '../models/responce.model';

export interface SettingDefinitionDto {
  settingDefinitionId: string;
  settingGroupId: string;
  settingKey: string;
  settingLabel: string;
  controlType: string;
  dataType: string;
  settingValue: string;
  placeholder?: string;
  isRequired: boolean;
  minLength?: number;
  maxLength?: number;
  regexPattern?: string;
  dropdownOptions?: string;
  displayOrder: number;
}

export interface SettingGroupDto {
  settingGroupId: string;
  groupName: string;
  groupCode: string;
  isActive: boolean;
  isPublicSetting: boolean;
  settingDefinitions: SettingDefinitionDto[];
}

export interface IDataTableResponse<T> {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: T[];
  error: string | null;
}

export interface PublicSettingState {
  schoolName: string;
  logo: string;
  upcomingYear: string;
  admissionButton: boolean;
  maxCarousel: number;
  maxNews: number;
  twitterURL: string;
  instagramURL: string;
  facebookURL: string;
  admissionForm: string;
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
}

const initialState: PublicSettingState = {
  schoolName: 'SIKSHA HUB',
  logo: 'favicon.svg',
  upcomingYear: '2026-27',
  admissionButton: true,
  maxCarousel: 5,
  maxNews: 3,
  twitterURL: '',
  instagramURL: '',
  facebookURL: '',
  admissionForm: '',
  isLoading: false,
  isSuccess: false,
  error: null
};

export const PublicSettingStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, http = inject(HttpService)) => {
    const hexToRgb = (hex: string): string | null => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : null;
    };

    const camelToKebab = (str: string): string => {
      return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    };

    return {
      loadSettings(): Promise<void> {
        patchState(store, { isLoading: true });
        return new Promise<void>((resolve) => {
          http.get<ApiResponse<IDataTableResponse<SettingGroupDto>>, any>(API.ADMIN.SITE_CONFIGURATION.GET_PUBLIC_SETTINGS).subscribe({
            next: (response) => {
              if (response && response.isSuccess && response.data) {
                const root = document.documentElement;
                let schoolName = store.schoolName();
                let logo = store.logo();
                let upcomingYear = store.upcomingYear();
                let admissionButton = store.admissionButton();
                let maxCarousel = store.maxCarousel();
                let maxNews = store.maxNews();
                let twitterURL = store.twitterURL();
                let instagramURL = store.instagramURL();
                let facebookURL = store.facebookURL();
                let admissionForm = store.admissionForm();

                response.data.data.forEach(group => {
                  group.settingDefinitions.forEach(def => {
                    const key = def.settingKey;
                    const val = def.settingValue;


                    // 1. Theme colors
                    if (group.groupCode === 'THEME' && val.startsWith('#')) {
                      root.style.setProperty(`--${camelToKebab(key)}`, val);
                      const rgb = hexToRgb(val);
                      if (rgb) {
                        root.style.setProperty(`--${camelToKebab(key)}-rgb`, rgb);
                      }
                    }

                    // 2. Core Settings
                    if (group.groupCode === 'CRS') {
                      if (key === 'schoolName') {
                        schoolName = val;
                      } else if (key === 'logo') {
                        logo = val.startsWith('data:') ? val : `data:image/jpeg;base64,${val}`;
                      } else if (key === 'upcomingAdmissionYear') {
                        upcomingYear = val;
                      } else if (key === 'admissionButton') {
                        admissionButton = val === '1' || val === 'true';
                      } else if (key === 'maxCarousel') {
                        maxCarousel = Number(val);
                      } else if (key === 'maxNews') {
                        maxNews = Number(val);
                      } else if (key === 'twitterURL') {
                        twitterURL = val;
                      } else if (key === 'instagramURL') {
                        instagramURL = val;
                      } else if (key === 'facebookURL') {
                        facebookURL = val;
                      } else if (key === 'admissionForm') {
                        admissionForm = val;
                      }
                    }
                  });
                });

                patchState(store, {
                  schoolName,
                  logo,
                  upcomingYear,
                  admissionButton,
                  maxCarousel,
                  maxNews,
                  twitterURL,
                  instagramURL,
                  facebookURL,
                  admissionForm,
                  isLoading: false,
                  isSuccess: true,
                  error: null
                });
              } else {
                patchState(store, { isLoading: false, isSuccess: false, error: response?.message || 'Failed to load settings' });
              }
              resolve();
            },
            error: (error) => {
              console.error('Error loading public settings', error);
              patchState(store, { isLoading: false, isSuccess: false, error: error.message });
              resolve();
            }
          });
        });
      }
    };
  })
);
