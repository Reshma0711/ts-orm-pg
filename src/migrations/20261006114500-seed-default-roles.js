'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const roles = [
      { roleName: 'admin', roleCode: 0 },
      { roleName: 'user', roleCode: 1 },
    ];

    for (const role of roles) {
      const [byName, byCode] = await Promise.all([
        queryInterface.rawSelect(
          'roles',
          { where: { roleName: role.roleName } },
          'id'
        ),
        queryInterface.rawSelect(
          'roles',
          { where: { roleCode: role.roleCode } },
          'id'
        ),
      ]);

      if (byName && byCode) {
        continue;
      }

      if (byName || byCode) {
        throw new Error(
          `Conflicting role data for ${role.roleName} (code ${role.roleCode})`
        );
      }

      await queryInterface.bulkInsert('roles', [{
        ...role,
        createdAt: new Date(),
        updatedAt: new Date(),
      }]);
    }
  },

  async down() {},
};
