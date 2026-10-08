'use strict';

const bcrypt = require('bcrypt');
const { QueryTypes } = require('sequelize');

const adminEmail = 'seed.admin@example.com';
const users = Array.from({ length: 20 }, (_, index) => {
  const number = String(index + 1).padStart(2, '0');

  return {
    firstName: 'Sample',
    lastName: `User${number}`,
    mobile: `986700${String(index + 1).padStart(4, '0')}`,
    email: `seed.user${number}@example.com`,
    username: `seeduser${number}`,
    password: 'UserPass1!',
  };
});

async function selectOne(queryInterface, sql, replacements, transaction) {
  const rows = await queryInterface.sequelize.query(sql, {
    replacements,
    transaction,
    type: QueryTypes.SELECT,
  });

  return rows[0];
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const adminRole = await selectOne(
        queryInterface,
        'SELECT id FROM roles WHERE "roleCode" = :roleCode',
        { roleCode: 0 },
        transaction
      );
      const userRole = await selectOne(
        queryInterface,
        'SELECT id FROM roles WHERE "roleCode" = :roleCode',
        { roleCode: 1 },
        transaction
      );

      if (!adminRole || !userRole) {
        throw new Error('Seed the admin and user roles before running this seeder');
      }

      let admin = await selectOne(
        queryInterface,
        'SELECT id, "roleId" FROM users WHERE email = :email',
        { email: adminEmail },
        transaction
      );

      if (admin && Number(admin.roleId) !== Number(adminRole.id)) {
        throw new Error(`${adminEmail} already exists but is not an admin`);
      }

      if (!admin) {
        await queryInterface.bulkInsert('users', [{
          firstName: 'Sample',
          lastName: 'Admin',
          mobile: '9867000000',
          email: adminEmail,
          username: 'seedadmin',
          password: await bcrypt.hash('AdminPass1!', 10),
          roleId: adminRole.id,
          assignedTo: null,
          accessToken: null,
          refreshToken: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }], { transaction });

        admin = await selectOne(
          queryInterface,
          'SELECT id FROM users WHERE email = :email',
          { email: adminEmail },
          transaction
        );
      }

      for (const user of users) {
        const existingUser = await selectOne(
          queryInterface,
          'SELECT id FROM users WHERE email = :email',
          { email: user.email },
          transaction
        );

        if (existingUser) {
          continue;
        }

        await queryInterface.bulkInsert('users', [{
          ...user,
          password: await bcrypt.hash(user.password, 10),
          roleId: userRole.id,
          assignedTo: admin.id,
          accessToken: null,
          refreshToken: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }], { transaction });
      }
    });
  },

  async down(queryInterface) {
    const emails = [
      adminEmail,
      ...users.map((user) => user.email),
    ];

    await queryInterface.bulkDelete('users', {
      email: emails,
    });
  },
};
