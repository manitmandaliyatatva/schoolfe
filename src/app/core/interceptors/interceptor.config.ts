import { API } from '../../shared/constants/api-url';

export const INTERCEPTOR_CONFIG = {
  // Endpoints that will not show the global loader
  BACKGROUND_REQUESTS: [
    API.AUTH.REFRESH_TOKEN,
    API.AUTH.LOGOUT,
    API.ADMIN.FEE.FEE_PAYMENT.CREATE_PAYMENT_INTENT
  ],
  
  // Endpoints that use the public loader instead of the standard loader
  PUBLIC_REQUESTS: [
    'SiteConfiguration'
  ],

  // Exact or partial URL matches that should NEVER show a success toast message (Case-sensitive)
  SILENT_API_KEYWORDS: [
    'List',
    'search',
    'ByTypeId',
    'Results'
  ],

  // Specific API endpoints that should NEVER show a success toast message
  SILENT_API_ENDPOINTS: [
    API.NOTIFICATION.MARK_AS_READ,
    API.NOTIFICATION.MARK_ALL_AS_READ,
    API.WIDGET_CONFIG.GLOBAL_FILTERS,
    API.ADMIN.CONFIGURATION.ACADEMIC_YEAR.SET_CURRENT
  ],

  // Exact or partial URL matches that should NEVER show a success toast message (Case-insensitive)
  SILENT_API_KEYWORDS_LOWERCASE: [
    'export'
  ]
};
