import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";
import User from "./user.model";

class LoginHistory extends Model<
  InferAttributes<LoginHistory>,
  InferCreationAttributes<LoginHistory>
> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare ipAddress: string;
  declare deviceType: string;
  declare deviceId: string;
  declare loggedOutAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initLoginHistoryModel(sequelize: Sequelize) {
  LoginHistory.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: false,
      },
      deviceType: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      deviceId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      loggedOutAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
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
      tableName: "login_histories",
      modelName: "LoginHistory",
      timestamps: true,
    }
  );

  return LoginHistory;
}

export function initLoginHistoryAssociations() {
  User.hasMany(LoginHistory, {
    as: "loginHistory",
    foreignKey: "userId",
  });
  LoginHistory.belongsTo(User, {
    as: "user",
    foreignKey: "userId",
  });
}

export default LoginHistory;
