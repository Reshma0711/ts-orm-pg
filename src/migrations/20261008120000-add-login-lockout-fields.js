'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await queryInterface.tableExists('users'))) {
      throw new Error(
        'The users table does not exist. Run the users-table recovery migration first.'
      );
    }

    const columns = await queryInterface.describeTable('users');

    if (!columns.failedLoginAttempts) {
      await queryInterface.addColumn('users', 'failedLoginAttempts', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }

    if (!columns.isLocked) {
      await queryInterface.addColumn('users', 'isLocked', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },

  async down(queryInterface) {
    if (!(await queryInterface.tableExists('users'))) {
      return;
    }

    const columns = await queryInterface.describeTable('users');

    if (columns.isLocked) {
      await queryInterface.removeColumn('users', 'isLocked');
    }

    if (columns.failedLoginAttempts) {
      await queryInterface.removeColumn('users', 'failedLoginAttempts');
    }
  },
};
