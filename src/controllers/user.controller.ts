import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { UniqueConstraintError } from "sequelize";

import Role, { ROLE_CODES } from "../models/role.model";
import User from "../models/user.model";
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

export class UserController {
    async uploadProfilePicture(req: Request, res: Response) {
      let uploadedFileName: string | undefined;

      try {
        const userId = (req as Request & { userId: number }).userId;
        const file = req.file;

        if (!file) {
          return sendFailure(res, 400, "Profile picture file is required");
        }

        uploadedFileName = file.filename;
        const user = await User.findByPk(userId);

        if (!user) {
          await removeLocalProfilePicture(uploadedFileName);
          uploadedFileName = undefined;
          return sendFailure(res, 404, "User not found");
        }

        const profilePicture = getLocalProfilePictureUrl(uploadedFileName);
        user.profilePicture = profilePicture;
        await user.save();
        uploadedFileName = undefined;

        return sendSuccess(res, "Profile picture uploaded successfully", {
          profilePicture,
        });
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
        const userId = (req as Request & { userId: number }).userId;
        const { fileName, contentType } = req.body;

        if (!["image/jpeg", "image/png", "image/webp"].includes(contentType)) {
          return sendFailure(
            res,
            400,
            "Profile picture must be JPEG, PNG, or WebP"
          );
        }

        const user = await User.findByPk(userId);
        if (!user) {
          return sendFailure(res, 404, "User not found");
        }

        const { uploadUrl, key } = await createS3UploadUrl(
          userId,
          fileName,
          contentType
        );

        user.profilePicture = key;
        await user.save();

        return sendSuccess(res, "Profile picture upload URL created", {
          uploadUrl,
          key,
          method: "PUT",
          headers: { "Content-Type": contentType },
          expiresIn: 300,
        });
      } catch (error) {
        console.error("Failed to create profile picture upload URL:", error);
        return sendServerError(res, error);
      }
    }

    async createAssignedUser(req: Request, res: Response) {
      try {
        const { firstName, lastName, mobile, email, password } = req.body;
        const adminId = (req as Request & { userId: number }).userId;

        const emailExists = await User.findOne({ where: { email } });
        if (emailExists) {
          return sendFailure(res, 409, "Email already exists");
        }

        const mobileExists = await User.findOne({ where: { mobile } });
        if (mobileExists) {
          return sendFailure(res, 409, "Mobile already exists");
        }

        const role = await Role.findOne({
          where: { roleCode: ROLE_CODES.user },
        });
        if (!role) {
          return sendFailure(res, 503, "User role is not configured");
        }

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

        return sendSuccess(res, "User created successfully", {
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
        }, 201);
      } catch (error) {
        if (error instanceof UniqueConstraintError) {
          return sendFailure(
            res,
            409,
            "Email, mobile, or username already exists"
          );
        }

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

        return sendSuccess(res, "Assigned users retrieved successfully", {
          pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit),
          },
          users,
        });
      } catch (error) {
        console.error("Failed to retrieve assigned users:", error);
        return sendServerError(res, error);
      }
    }

    async getAssignedUserById(req: Request, res: Response) {
      try {
        const requesterId = (req as Request & { userId: number }).userId;
        const requestedUserId = Number(req.params.id);
        const requester = await User.findByPk(requesterId);

        if (!requester) {
          return sendFailure(res, 401, "Authenticated user not found");
        }

        const requesterRole = requester.roleId
          ? await Role.findByPk(requester.roleId)
          : null;
        const isAdmin = requesterRole?.roleCode === ROLE_CODES.admin;

        if (requestedUserId !== requesterId && !isAdmin) {
          return sendFailure(res, 403, "You can only view your own user details");
        }

        const user = await User.findOne({
          where: {
            id: requestedUserId,
            ...(requestedUserId !== requesterId
              ? { assignedTo: requesterId }
              : {}),
          },
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
          include: [
            {
              model: Role,
              as: "role",
              attributes: ["roleCode", "roleName"],
            },
            {
              model: User,
              as: "assignedToAdmin",
              attributes: ["id", "firstName", "lastName"],
            },
          ],
        });

        if (!user) {
          return sendFailure(res, 404, "Assigned user not found");
        }

        return sendSuccess(res, "Assigned user retrieved successfully", { user });
      } catch (error) {
        console.error("Failed to retrieve assigned user:", error);
        return sendServerError(res, error);
      }
    }

    async updateAssignedUser(req: Request, res: Response) {
      try {
        const adminId = (req as Request & { userId: number }).userId;
        const { firstName, lastName, mobile, email } = req.body;

        if (
          firstName === undefined &&
          lastName === undefined &&
          mobile === undefined &&
          email === undefined
        ) {
          return sendFailure(res, 400, "At least one profile field must be provided");
        }

        const user = await User.findOne({
          where: {
            id: Number(req.params.id),
            assignedTo: adminId,
          },
        });

        if (!user) {
          return sendFailure(res, 404, "Assigned user not found");
        }

        if (email !== undefined && email !== user.email) {
          const emailExists = await User.findOne({ where: { email } });
          if (emailExists) {
            return sendFailure(res, 409, "Email already exists");
          }
          user.email = email;
        }

        if (mobile !== undefined && mobile !== user.mobile) {
          const mobileExists = await User.findOne({ where: { mobile } });
          if (mobileExists) {
            return sendFailure(res, 409, "Mobile already exists");
          }
          user.mobile = mobile;
        }

        if (firstName !== undefined) {
          user.firstName = firstName;
        }
        if (lastName !== undefined) {
          user.lastName = lastName;
        }

        await user.save();

        return sendSuccess(res, "Assigned user updated successfully", {
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            mobile: user.mobile,
            email: user.email,
            username: user.username,
          },
        });
      } catch (error) {
        if (error instanceof UniqueConstraintError) {
          return sendFailure(res, 409, "Email or mobile already exists");
        }

        console.error("Failed to update assigned user:", error);
        return sendServerError(res, error);
      }
    }

    async deleteAssignedUser(req: Request, res: Response) {
      try {
        const adminId = (req as Request & { userId: number }).userId;
        const user = await User.findOne({
          where: {
            id: Number(req.params.id),
            assignedTo: adminId,
          },
        });

        if (!user) {
          return sendFailure(res, 404, "Assigned user not found");
        }

        await user.destroy();
        return sendSuccess(res, "Assigned user deleted successfully");
      } catch (error) {
        console.error("Failed to delete assigned user:", error);
        return sendServerError(res, error);
      }
    }
}
