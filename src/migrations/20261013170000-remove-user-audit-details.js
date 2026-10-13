'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    if (!(await queryInterface.tableExists('user_audit_logs'))) {
      return;
    }

    const columns = await queryInterface.describeTable('user_audit_logs');
    for (const column of ['before', 'after', 'ipAddress', 'userAgent']) {
      if (columns[column]) {
        await queryInterface.removeColumn('user_audit_logs', column);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    if (!(await queryInterface.tableExists('user_audit_logs'))) {
      return;
    }

    const columns = await queryInterface.describeTable('user_audit_logs');
    const removedColumns = {
      before: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      after: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      ipAddress: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    };

    for (const [column, definition] of Object.entries(removedColumns)) {
      if (!columns[column]) {
        await queryInterface.addColumn('user_audit_logs', column, definition);
      }
    }
  },
};
