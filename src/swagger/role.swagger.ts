/**
 * @openapi
 * /roles:
 *   get:
 *     tags: [Roles]
 *     summary: List roles
 *     responses:
 *       '200': { description: Roles returned }
 *       '500': { description: Server error }
 */

/**
 * @openapi
 * /roles/{id}:
 *   get:
 *     tags: [Roles]
 *     summary: Get a role by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       '200': { description: Role returned }
 *       '400': { description: Invalid role ID }
 *       '404': { description: Role not found }
 *       '500': { description: Server error }
 */

/**
 * @openapi
 * /roles:
 *   post:
 *     tags: [Roles]
 *     summary: Create a role
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roleName]
 *             properties:
 *               roleName: { type: string, enum: [admin, user] }
 *     responses:
 *       '200': { description: Role created }
 *       '400': { description: Invalid role name }
 *       '409': { description: Role already exists }
 *       '500': { description: Server error }
 */

/**
 * @openapi
 * /roles/{id}:
 *   put:
 *     tags: [Roles]
 *     summary: Update a role
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roleName]
 *             properties:
 *               roleName: { type: string, enum: [admin, user] }
 *     responses:
 *       '200': { description: Role updated }
 *       '400': { description: Invalid role ID or role name }
 *       '404': { description: Role not found }
 *       '409': { description: Role already exists }
 *       '500': { description: Server error }
 */

/**
 * @openapi
 * /roles/{id}:
 *   delete:
 *     tags: [Roles]
 *     summary: Delete a role
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       '200': { description: Role deleted }
 *       '400': { description: Invalid role ID }
 *       '404': { description: Role not found }
 *       '500': { description: Server error }
 */
