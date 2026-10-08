import { rateLimit } from "express-rate-limit";

import { sendFailure } from "../utils/api-response.util";

export const authRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendFailure(res, 429, "Too many requests. Please try again in a minute.");
  },
});
