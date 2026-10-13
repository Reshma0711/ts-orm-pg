export interface IRegisterRequest {
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  password: string;
  roleCode: number;
  assignedTo?: number;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRefreshTokenRequest {
  refreshToken: string;
}

export interface IUpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  mobile?: string;
  email?: string;
}

export interface IForgotPasswordRequest {
  email: string;
}

export interface IResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface IChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
