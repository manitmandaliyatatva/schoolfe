
export interface LoginModel {
  email: string;
  password: string;
  userTypeId?: string;
}

export interface ILoginResponse {
  accessToken: string;
  refreshToken: string;
  isFirstTimeLogin?: boolean;
  tempToken?: string | null;
  refreshTokenExpiry: Date;
  userTypes?: { userTypeId: string; userTypeName: string }[];
}

export interface IAuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isLoggedIn: boolean;
  isFirstTimeLogin: boolean;
  tempToken: string | null;
  accessTokenExpiry: string | null;
  refreshTokenExpiry: string | null;
  userId: string | null;
  entityid: string | null;
  email: string | null;
  name: string | null;
  usertype: string | null;
  rolePrefix: string | null;
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  userTypes: { userTypeId: string; userTypeName: string }[] | null;
  academicyearid: string | null;
  branchid: string | null;
  academicyearstartdate: string | null;
  academicyearenddate: string | null;
  iscurrentacademicyear: boolean | null;
  isprimaryadmin: boolean;
  profilePhoto: string | null;
}

export const initialAuthState = (): IAuthState => ({
  accessToken: null,
  refreshToken: null,
  isLoggedIn: false,
  isFirstTimeLogin: false,
  tempToken: null,
  accessTokenExpiry: null,
  refreshTokenExpiry: null,
  userId: null,
  entityid: null,
  email: null,
  name: null,
  usertype: null,
  rolePrefix: null,
  isLoading: false,
  isSuccess: false,
  error: null,
  userTypes: null,
  academicyearid: null,
  branchid: null,
  academicyearstartdate: null,
  academicyearenddate: null,
  iscurrentacademicyear: null,
  isprimaryadmin: false,
  profilePhoto: null,
});

export interface IAuthApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface IForgotPasswordRequest {
  email: string;
}

export interface IResetPasswordRequest {
  newPassword: string;
  tempToken: string;
}

export interface IChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}