import { Request, Response } from "express";
import bcrypt from "bcrypt";

import Role from "../models/role.model";
import User from "../models/user.model";
import LoginHistory from "../models/login-history.model";
import {
  sendFailure,
  sendServerError,
  sendSuccess,
} from "../utils/api-response.util";
import { createS3UploadUrl } from "../services/s3.service";
import {
  getLocalProfilePictureUrl,
  removeLocalProfilePicture,
} from "../services/local-upload.service";
import type {
  ICreateAssignedUserRequest,
  ICreateProfilePictureUploadUrlRequest,
  IUpdateAssignedUserRequest,
} from "../interfaces/request/user.request";
import type {
  IAssignedUserDetailResponseData,
  IAssignedUsersResponseData,
  ICreateAssignedUserResponseData,
  IDeleteAssignedUserResponseData,
  ILoginHistoryItemResponse,
  IProfilePictureResponseData,
  IProfilePictureUploadUrlResponseData,
  IUpdatedAssignedUserResponseData,
  IUserLoginHistoryResponseData,
  IUserPaginationResponse,
} from "../interfaces/response/user.response";

export class UserController {

    async uploadProfilePicture(req: Request, res: Response) {
      let uploadedFileName: string | undefined;

      try {
        const file = req.file;

        if (!file) {
          return sendFailure(res, 400, "Profile picture file is required");
        }

        uploadedFileName = file.filename;
        const user = req.authenticatedUser!;
        const profilePicture = getLocalProfilePictureUrl(uploadedFileName);
        user.profilePicture = profilePicture;
        await user.save();
        uploadedFileName = undefined;

        const responseData: IProfilePictureResponseData = {
          profilePicture,
        };

        return sendSuccess(res, "Profile picture uploaded successfully", responseData);
      } catch (error) {
        if (uploadedFileName) {
          try {
            await removeLocalProfilePicture(uploadedFileName);
          } catch (cleanupError) {
            console.error("Failed to remove incomplete profile picture upload:", cleanupError);
          }
        }

        console.error("Failed to upload profile picture:", error);
        return sendServerError(res, error);
      }
    }

    async createProfilePictureUploadUrl(req: Request, res: Response) {
      try {
        const user = req.authenticatedUser!;
        const { fileName, contentType }: ICreateProfilePictureUploadUrlRequest =
          req.body;

        const { uploadUrl, key } = await createS3UploadUrl(
          user.id,
          fileName,
          contentType
        );

        user.profilePicture = key;
        await user.save();

        const responseData: IProfilePictureUploadUrlResponseData = {
          uploadUrl,
          key,
          method: "PUT",
          headers: { "Content-Type": contentType },
          expiresIn: 300,
        };

        return sendSuccess(res, "Profile picture upload URL created", responseData);
      } catch (error) {
        console.error("Failed to create profile picture upload URL:", error);
        return sendServerError(res, error);
      }
    }

    async createAssignedUser(req: Request, res: Response) {
      try {
        const {
          firstName,
          lastName,
          mobile,
          email,
          password,
        }: ICreateAssignedUserRequest = req.body;
        const adminId = (req as Request & { userId: number }).userId;

        const role = req.validatedUserRole!;

        const username =
          firstName.toLowerCase() +
          lastName.toLowerCase() +
          Math.floor(Math.random() * 10000);

        const user = await User.create({
          firstName,
          lastName,
          mobile,
          email,
          username,
          password: await bcrypt.hash(password, 10),
          roleId: role.id,
          assignedTo: adminId,
        });

        const responseData: ICreateAssignedUserResponseData = {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            mobile: user.mobile,
            email: user.email,
            username: user.username,
            roleCode: role.roleCode,
            roleName: role.roleName,
            assignedTo: user.assignedTo,
          },
        };

        return sendSuccess(res, "User created successfully", responseData, 201);
      } catch (error) {
        console.error("Failed to create assigned user:", error);
        return sendServerError(res, error);
      }
    }

    async listAssignedUsers(req: Request, res: Response) {
      try {
        const adminId = (req as Request & { userId: number }).userId;
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 10);
        const offset = (page - 1) * limit;
        const { count, rows: users } = await User.findAndCountAll({
          where: { assignedTo: adminId },
          attributes: [
            "id",
            "firstName",
            "lastName",
            "mobile",
            "email",
            "username",
            "roleId",
            "assignedTo",
            "profilePicture",
            "createdAt",
          ],
          include: [{
            model: Role,
            as: "role",
            attributes: ["roleCode", "roleName"],
          }],
          order: [["id", "ASC"]],
          limit,
          offset,
        });

        const pagination: IUserPaginationResponse = {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit),
        };
        const responseData: IAssignedUsersResponseData = {
          pagination,
          users: users.map((user) => ({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            mobile: user.mobile,
            email: user.email,
            username: user.username,
            roleId: user.roleId,
            assignedTo: user.assignedTo,
            profilePicture: user.profilePicture,
            createdAt: user.createdAt,
            role: user.role
              ? {
                  roleCode: user.role.roleCode,
                  roleName: user.role.roleName,
                }
              : null,
          })),
        };

        return sendSuccess(res, "Assigned users retrieved successfully", responseData);
      } catch (error) {
        console.error("Failed to retrieve assigned users:", error);
        return sendServerError(res, error);
      }
    }

    async getUserLoginHistory(req: Request, res: Response) {
      try {
        const requestedUserId = req.authenticatedUser!.id;
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 10);

        const offset = (page - 1) * limit;
        const { count, rows: history } = await LoginHistory.findAndCountAll({
          where: { userId: requestedUserId },
          attributes: [
            "id",
            "ipAddress",
            "deviceType",
            "deviceId",
            "createdAt",
            "loggedOutAt",
          ],
          order: [["createdAt", "DESC"]],
          limit,
          offset,
        });

        const pagination: IUserPaginationResponse = {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        };
        const historyData: ILoginHistoryItemResponse[] = history.map((entry) => ({
          id: entry.id,
          ipAddress: entry.ipAddress,
          deviceType: entry.deviceType,
          deviceId: entry.deviceId,
          createdAt: entry.createdAt,
          loggedOutAt: entry.loggedOutAt,
        }));
        const responseData: IUserLoginHistoryResponseData = {
          userId: requestedUserId,
          pagination,
          history: historyData,
        };

        return sendSuccess(res, "User login history retrieved successfully", responseData);
      } catch (error) {
        console.error("Failed to retrieve user login history:", error);
        return sendServerError(res, error);
      }
    }

    async getAssignedUserById(req: Request, res: Response) {
      try {
        const requestedUserId = Number(req.params.id);
        const user = req.validatedTargetUser!;

        const responseData: IAssignedUserDetailResponseData = {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            mobile: user.mobile,
            email: user.email,
            username: user.username,
            roleId: user.roleId,
            assignedTo: user.assignedTo,
            profilePicture: user.profilePicture,
            createdAt: user.createdAt,
            role: user.role
              ? {
                  roleCode: user.role.roleCode,
                  roleName: user.role.roleName,
                }
              : null,
            assignedToAdmin: user.assignedToAdmin
              ? {
                  id: user.assignedToAdmin.id,
                  firstName: user.assignedToAdmin.firstName,
                  lastName: user.assignedToAdmin.lastName,
                }
              : null,
          },
        };

        return sendSuccess(res, "Assigned user retrieved successfully", responseData);
      } catch (error) {
        console.error("Failed to retrieve assigned user:", error);
        return sendServerError(res, error);
      }
    }

    async updateAssignedUser(req: Request, res: Response) {
      try {
        const adminId = req.authenticatedUser!.id;
        const {
          firstName,
          lastName,
          mobile,
          email,
        }: IUpdateAssignedUserRequest = req.body;

        const user = req.validatedTargetUser!;

        if (email !== undefined) {
          user.email = email;
        }

        if (mobile !== undefined) {
          user.mobile = mobile;
        }

        if (firstName !== undefined) {
          user.firstName = firstName;
        }
        if (lastName !== undefined) {
          user.lastName = lastName;
        }

        await user.save();

        const responseData: IUpdatedAssignedUserResponseData = {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            mobile: user.mobile,
            email: user.email,
            username: user.username,
          },
        };

        return sendSuccess(res, "Assigned user updated successfully", responseData);
      } catch (error) {
        console.error("Failed to update assigned user:", error);
        return sendServerError(res, error);
      }
    }

    async deleteAssignedUser(req: Request, res: Response) {
      try {
        const user = req.validatedTargetUser!;

        await user.destroy();
        const responseData: IDeleteAssignedUserResponseData = {};
        return sendSuccess(res, "Assigned user deleted successfully", responseData);
      } catch (error) {
        console.error("Failed to delete assigned user:", error);
        return sendServerError(res, error);
      }
    }
}
