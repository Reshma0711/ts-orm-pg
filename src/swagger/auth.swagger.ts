/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register an account
 *     description: roleCode 0 creates an admin; roleCode 1 requires assignedTo to be an existing admin ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, mobile, email, password, roleCode]
 *             properties:
 *               firstName: { type: string, minLength: 2, maxLength: 20, example: Jane }
 *               lastName: { type: string, minLength: 2, maxLength: 20, example: Doe }
 *               mobile: { type: string, pattern: '^[0-9]{10,15}$', example: '1234567890' }
 *               email: { type: string, format: email, example: jane@example.com }
 *               password: { type: string, format: password, example: Password1! }
 *               roleCode: { type: integer, enum: [0, 1] }
 *               assignedTo: { type: integer, minimum: 1, example: 1 }
 *     responses:
 *       '201': { description: Account registered }
 *       '400': { description: Invalid request, role unavailable, or assignedTo is not an admin }
 *       '409': { description: Duplicate account data detected during creation }
 *       '429': { description: Auth rate limit exceeded }
 *       '500': { description: Server error }
 */

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Log in and start a device session
 *     description: A later login replaces the active session. Six failed attempts lock the account until password reset. A successful login creates a login history row with a generated unique device ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: jane@example.com }
 *               password: { type: string, format: password }
 *     responses:
 *       '200': { description: Login successful; returns accessToken, refreshToken, deviceId, and user }
 *       '401': { description: Invalid credentials }
 *       '423': { description: Account is locked }
 *       '429': { description: Auth rate limit exceeded }
 *       '500': { description: Server error }
 */

/**
 * @openapi
 * /auth/refresh-token:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh an access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       '200': { description: New access token returned }
 *       '401': { description: Refresh token invalid, expired, or superseded }
 *       '429': { description: Auth rate limit exceeded }
 *       '500': { description: Server error }
 */

/**
 * @openapi
 * /auth/profile:
 *   get:
 *     tags: [Authentication]
 *     summary: Get the authenticated user's profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200': { description: Profile returned }
 *       '401': { description: Missing, invalid, expired, or superseded access token }
 *       '404': { description: User not found }
 *       '500': { description: Server error }
 */

/**
 * @openapi
 * /auth/profile:
 *   patch:
 *     tags: [Authentication]
 *     summary: Update the authenticated user's profile
 *     description: Partial update. Role and assignedTo cannot be changed here.
 *     security:
 *       - bearerAuth: []
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
 *       '200': { description: Profile updated }
 *       '400': { description: Invalid request or duplicate value }
 *       '401': { description: Authentication required }
 *       '500': { description: Server error }
 */

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Request a password reset OTP
 *     description: Generic response prevents account enumeration. Development uses a static OTP; reset requests are disabled in production until email delivery is enabled.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email, example: jane@example.com }
 *     responses:
 *       '200': { description: Generic reset request response }
 *       '400': { description: Invalid email }
 *       '429': { description: Auth rate limit exceeded }
 *       '503': { description: Password reset disabled in production }
 *       '500': { description: Server error }
 */

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Reset password using an OTP
 *     description: OTP expires after 10 minutes and is invalidated after five incorrect attempts. Successful reset clears account lockout and revokes the active session.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp, newPassword]
 *             properties:
 *               email: { type: string, format: email }
 *               otp: { type: string, pattern: '^[0-9]{6}$', example: '123456' }
 *               newPassword: { type: string, format: password, minLength: 8, maxLength: 100 }
 *     responses:
 *       '200': { description: Password reset }
 *       '400': { description: Invalid or expired OTP or invalid password }
 *       '429': { description: Auth rate limit exceeded }
 *       '500': { description: Server error }
 */

/**
 * @openapi
 * /auth/change-password:
 *   patch:
 *     tags: [Authentication]
 *     summary: Change password while authenticated
 *     description: Requires the current password; revokes the active session after changing it.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string, format: password }
 *               newPassword: { type: string, format: password, minLength: 8, maxLength: 100 }
 *     responses:
 *       '200': { description: Password changed }
 *       '400': { description: Current password incorrect or new password invalid }
 *       '401': { description: Authentication required }
 *       '500': { description: Server error }
 */

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Log out of the current device
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200': { description: Session revoked }
 *       '401': { description: Authentication required }
 *       '500': { description: Server error }
 */
