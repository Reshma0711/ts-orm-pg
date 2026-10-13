export interface IProfilePictureResponseData {
  profilePicture: string;
}

export interface IProfilePictureUploadHeadersResponse {
  "Content-Type": string;
}

export interface IProfilePictureUploadUrlResponseData {
  uploadUrl: string;
  key: string;
  method: "PUT";
  headers: IProfilePictureUploadHeadersResponse;
  expiresIn: number;
}

export interface ICreatedAssignedUserResponse {
  id: number;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  username: string;
  roleCode: number;
  roleName: string;
  assignedTo: number | null;
}

export interface ICreateAssignedUserResponseData {
  user: ICreatedAssignedUserResponse;
}

export interface IUserPaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IUserRoleResponse {
  roleCode: number;
  roleName: string;
}

export interface IAssignedUserListItemResponse {
  id: number;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  username: string;
  roleId: number | null;
  assignedTo: number | null;
  profilePicture: string | null;
  createdAt: Date;
  role: IUserRoleResponse | null;
}

export interface IAssignedUsersResponseData {
  pagination: IUserPaginationResponse;
  users: IAssignedUserListItemResponse[];
}

export interface ILoginHistoryItemResponse {
  id: number;
  ipAddress: string;
  deviceType: string;
  deviceId: string;
  createdAt: Date;
  loggedOutAt: Date | null;
}

export interface IUserLoginHistoryResponseData {
  userId: number;
  pagination: IUserPaginationResponse;
  history: ILoginHistoryItemResponse[];
}

export interface IAssignedUserAdminResponse {
  id: number;
  firstName: string;
  lastName: string;
}

export interface IAssignedUserDetailResponse
  extends IAssignedUserListItemResponse {
  role: IUserRoleResponse | null;
  assignedToAdmin: IAssignedUserAdminResponse | null;
}

export interface IAssignedUserDetailResponseData {
  user: IAssignedUserDetailResponse;
}

export interface IUpdatedAssignedUserResponse {
  id: number;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  username: string;
}

export interface IUpdatedAssignedUserResponseData {
  user: IUpdatedAssignedUserResponse;
}

export type IDeleteAssignedUserResponseData = Record<string, never>;

export interface IUserAuditLogItemResponse {
  id: number;
  adminId: number;
  userId: number;
  action: "USER_CREATED" | "USER_UPDATED" | "USER_DELETED";
  createdAt: Date;
}

export interface IUserAuditLogsResponseData {
  pagination: IUserPaginationResponse;
  auditLogs: IUserAuditLogItemResponse[];
}
