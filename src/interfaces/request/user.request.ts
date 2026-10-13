export interface ICreateProfilePictureUploadUrlRequest {
  fileName: string;
  contentType: "image/jpeg" | "image/png" | "image/webp";
}

export interface ICreateAssignedUserRequest {
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  password: string;
}

export interface IUpdateAssignedUserRequest {
  firstName?: string;
  lastName?: string;
  mobile?: string;
  email?: string;
}
