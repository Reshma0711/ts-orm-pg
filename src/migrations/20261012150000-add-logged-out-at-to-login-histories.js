'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await queryInterface.tableExists('login_histories'))) {
      throw new Error(
        'The login_histories table does not exist. Run its creation migration first.'
      );
    }

    const columns = await queryInterface.describeTable('login_histories');
    if (!columns.loggedOutAt) {
      await queryInterface.addColumn('login_histories', 'loggedOutAt', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  async down(queryInterface) {
    if (!(await queryInterface.tableExists('login_histories'))) {
      return;
    }

    const columns = await queryInterface.describeTable('login_histories');
    if (columns.loggedOutAt) {
      await queryInterface.removeColumn('login_histories', 'loggedOutAt');
    }
  },
};
