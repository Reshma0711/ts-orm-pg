import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";

export type UserAuditAction = "USER_CREATED" | "USER_UPDATED" | "USER_DELETED";
class UserAuditLog extends Model<
  InferAttributes<UserAuditLog>,
  InferCreationAttributes<UserAuditLog>
> {
  declare id: CreationOptional<number>;
  declare adminId: number;
  declare userId: number;
  declare action: UserAuditAction;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initUserAuditLogModel(sequelize: Sequelize) {
  UserAuditLog.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      adminId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      action: {
        type: DataTypes.ENUM("USER_CREATED", "USER_UPDATED", "USER_DELETED"),
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "user_audit_logs",
      modelName: "UserAuditLog",
      timestamps: true,
    }
  );

  return UserAuditLog;
}

export default UserAuditLog;
