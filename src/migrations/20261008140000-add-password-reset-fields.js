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

    if (!columns.resetTokenHash) {
      await queryInterface.addColumn('users', 'resetTokenHash', {
        type: Sequelize.STRING(64),
        allowNull: true,
        defaultValue: null,
      });
    }

    if (!columns.resetTokenExpiresAt) {
      await queryInterface.addColumn('users', 'resetTokenExpiresAt', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  async down(queryInterface) {
    if (!(await queryInterface.tableExists('users'))) {
      return;
    }

    const columns = await queryInterface.describeTable('users');

    if (columns.resetTokenExpiresAt) {
      await queryInterface.removeColumn('users', 'resetTokenExpiresAt');
    }

    if (columns.resetTokenHash) {
      await queryInterface.removeColumn('users', 'resetTokenHash');
    }
  },
};
