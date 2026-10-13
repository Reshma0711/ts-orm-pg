'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await queryInterface.tableExists('users'))) {
      throw new Error('The users table must exist before creating login histories.');
    }

    if (await queryInterface.tableExists('login_histories')) {
      return;
    }

    await queryInterface.createTable('login_histories', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      ipAddress: {
        type: Sequelize.STRING(45),
        allowNull: false,
      },
      deviceType: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      deviceId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
      },
      loggedOutAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('login_histories', ['userId', 'createdAt'], {
      name: 'login_histories_user_id_created_at',
    });
  },

  async down(queryInterface) {
    if (await queryInterface.tableExists('login_histories')) {
      await queryInterface.dropTable('login_histories');
    }
  },
};
