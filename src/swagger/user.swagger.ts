/**
 * @openapi
 * /users/upload:
 *   post:
 *     tags: [Users]
 *     summary: Upload a profile picture
 *     description: Upload JPEG, PNG, or WebP image up to 5 MB as multipart form data.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       '200': { description: Profile picture uploaded }
 *       '400': { description: Invalid or missing image }
 *       '401': { description: Authentication required }
 *       '413': { description: File exceeds 5 MB }
 *       '500': { description: Server error }
 */

/**
 * @openapi
 * /users/upload-url:
 *   post:
 *     tags: [Users]
 *     summary: Create a profile-picture upload URL
 *     description: Returns an S3 signed URL; upload the image bytes to it using PUT and the returned Content-Type.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fileName, contentType]
 *             properties:
 *               fileName: { type: string, maxLength: 255, example: profile.png }
 *               contentType: { type: string, enum: [image/jpeg, image/png, image/webp] }
 *     responses:
 *       '200': { description: Signed upload URL created }
 *       '400': { description: Invalid file details }
 *       '401': { description: Authentication required }
 *       '404': { description: User not found }
 *       '500': { description: Server error }
 */

/**
 * @openapi
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: Create a user assigned to the current admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, mobile, email, password]
 *             properties:
 *               firstName: { type: string, minLength: 2, maxLength: 20 }
 *               lastName: { type: string, minLength: 2, maxLength: 20 }
 *               mobile: { type: string, pattern: '^[0-9]{10,15}$' }
 *               email: { type: string, format: email }
 *               password: { type: string, format: password, minLength: 8, maxLength: 100 }
 *     responses:
 *       '201': { description: Assigned user created }
 *       '400': { description: Invalid request }
 *       '401': { description: Authentication required }
 *       '403': { description: Admin role required }
 *       '409': { description: Email, mobile, or username already exists }
 *       '503': { description: User role is not configured }
 *       '500': { description: Server error }
 */

/**
 * @openapi
 * /users/assigned:
 *   get:
 *     tags: [Users]
 *     summary: List users assigned to the authenticated admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
 *     responses:
 *       '200': { description: Paginated assigned users returned }
 *       '400': { description: Invalid pagination values }
 *       '401': { description: Authentication required }
 *       '403': { description: Admin role required }
 *       '500': { description: Server error }
 */

/**
 * @openapi
 * /users/login-history:
 *   get:
 *     tags: [Users]
 *     summary: Get the authenticated user's login history
 *     description: Returns login history for the user identified by the bearer token.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
 *     responses:
 *       '200': { description: Paginated login history returned }
 *       '400': { description: Invalid pagination values }
 *       '401': { description: Authentication required }
 *       '500': { description: Server error }
 */

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get a user by ID
 *     description: Regular users may retrieve their own record. Admins may retrieve their own or users assigned to them.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       '200': { description: User returned }
 *       '400': { description: Invalid user ID }
 *       '401': { description: Authentication required }
 *       '403': { description: User cannot view the requested record }
 *       '404': { description: User not found or not assigned to this admin }
 *       '500': { description: Server error }
 */

/**
 * @openapi
 * /users/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: Update an assigned user
 *     description: Admin-only partial update. Role and assignedTo cannot be changed.
 *     security:
 *       - bearerAuth: []
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
 *             minProperties: 1
 *             additionalProperties: false
 *             properties:
 *               firstName: { type: string, minLength: 2, maxLength: 20 }
 *               lastName: { type: string, minLength: 2, maxLength: 20 }
 *               mobile: { type: string, pattern: '^[0-9]{10,15}$' }
 *               email: { type: string, format: email }
 *     responses:
 *       '200': { description: Assigned user updated }
 *       '400': { description: Invalid request }
 *       '401': { description: Authentication required }
 *       '403': { description: Admin role required }
 *       '404': { description: Assigned user not found }
 *       '409': { description: Email or mobile already exists }
 *       '500': { description: Server error }
 */

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete an assigned user
 *     description: Admin-only; deletes only a user assigned to the authenticated admin.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       '200': { description: Assigned user deleted }
 *       '401': { description: Authentication required }
 *       '403': { description: Admin role required }
 *       '404': { description: Assigned user not found }
 *       '500': { description: Server error }
 */
