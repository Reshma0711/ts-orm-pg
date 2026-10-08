import {
  Model,
  DataTypes,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import Role from "./role.model";

class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  declare id: CreationOptional<number>;

  declare firstName: string;
  declare lastName: string;
  declare mobile: string;
  declare email: string;
  declare username: string;
  declare password: string;

  declare roleId: CreationOptional<number | null>;
  declare assignedTo: CreationOptional<number | null>;
  declare profilePicture: CreationOptional<string | null>;
  declare failedLoginAttempts: CreationOptional<number>;
  declare isLocked: CreationOptional<boolean>;
  declare lockedAt: CreationOptional<Date | null>;
  declare resetOtpHash: CreationOptional<string | null>;
  declare resetOtpExpiresAt: CreationOptional<Date | null>;
  declare resetOtpAttempts: CreationOptional<number>;

  declare accessToken: string | null;
  declare refreshToken: string | null;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initUserModel(sequelize: Sequelize) {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      firstName: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },

      lastName: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },

      mobile: {
        type: DataTypes.STRING(15),
        allowNull: false,
        unique: true,
      },

      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },

      username: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
      },

      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      roleId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "roles",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      assignedTo: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      profilePicture: {
        type: DataTypes.STRING(1024),
        allowNull: true,
      },

      failedLoginAttempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      isLocked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      lockedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },

      resetOtpHash: {
        type: DataTypes.STRING(64),
        allowNull: true,
        defaultValue: null,
      },

      resetOtpExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },

      resetOtpAttempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      accessToken: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      refreshToken: {
        type: DataTypes.TEXT,
        allowNull: true,
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
      tableName: "users",
      modelName: "User",
      timestamps: true,
    }
  );

  return User;
}

export function initUserAssociations() {
  User.belongsTo(Role, {
    as: "role",
    foreignKey: "roleId",
  });
  User.belongsTo(User, {
    as: "assignedToAdmin",
    foreignKey: "assignedTo",
  });
}

export default User;