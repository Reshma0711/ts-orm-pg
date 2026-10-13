'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (await queryInterface.tableExists('user_audit_logs')) {
      return;
    }

    await queryInterface.createTable('user_audit_logs', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      adminId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      action: {
        type: Sequelize.ENUM('USER_CREATED', 'USER_UPDATED', 'USER_DELETED'),
        allowNull: false,
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

    await queryInterface.addIndex('user_audit_logs', ['adminId', 'createdAt'], {
      name: 'user_audit_logs_admin_created_at',
    });
    await queryInterface.addIndex('user_audit_logs', ['userId', 'createdAt'], {
      name: 'user_audit_logs_user_created_at',
    });
  },

  async down(queryInterface) {
    if (await queryInterface.tableExists('user_audit_logs')) {
      await queryInterface.dropTable('user_audit_logs');
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_user_audit_logs_action";'
      );
    }
  },
};
