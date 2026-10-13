export interface IRegisteredUserResponse {
  id: number;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  username: string;
  roleCode: number;
  roleName: string;
}

export interface IRegisterResponseData {
  user: IRegisteredUserResponse;
}

export interface ILoginUserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  username: string;
  profilePicture: string | null;
}

export interface ILoginResponseData {
  accessToken: string;
  refreshToken: string;
  deviceId: string;
  user: ILoginUserResponse;
}

export interface IRefreshTokenResponseData {
  accessToken: string;
}

export interface IProfileUserResponse {
  id: number;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  username: string;
  profilePicture: string | null;
}

export interface IProfileResponseData {
  user: IProfileUserResponse;
}

export interface IUpdatedProfileUserResponse {
  id: number;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  username: string;
}

export interface IUpdatedProfileResponseData {
  user: IUpdatedProfileUserResponse;
}

export interface IForgotPasswordResponseData {
  otp?: string;
}

export type IEmptyResponseData = Record<string, never>;
