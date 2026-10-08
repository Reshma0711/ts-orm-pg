import jwt from "jsonwebtoken";
// import dotenv from "dotenv";

// dotenv.config();

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

function requireSecret(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`${name} is not defined`);
  }

  return value;
}

const ACCESS_SECRET_KEY = requireSecret(
  process.env.JWT_ACCESS_SECRET,
  "JWT_ACCESS_SECRET"
);
const REFRESH_SECRET_KEY = requireSecret(
  process.env.JWT_REFRESH_SECRET,
  "JWT_REFRESH_SECRET"
);

interface TokenPayload {
  userId: number;
}

export function createAccessToken(userId: number) {
  return jwt.sign(
    { userId },
    ACCESS_SECRET_KEY,
    {
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    }
  );
}

export function createRefreshToken(userId: number) {
  return jwt.sign(
    { userId },
    REFRESH_SECRET_KEY,
    {
      expiresIn: REFRESH_TOKEN_TTL_SECONDS,
    }
  );
}

export function verifyAccessToken(token: string): TokenPayload {
  return verifyToken(token, ACCESS_SECRET_KEY);
}

export function verifyRefreshToken(token: string): TokenPayload {
  return verifyToken(token, REFRESH_SECRET_KEY);
}

function verifyToken(token: string, secret: string): TokenPayload {
  const decoded = jwt.verify(token, secret);

  if (typeof decoded === "string" || typeof decoded.userId !== "number") {
    throw new jwt.JsonWebTokenError("Invalid token payload");
  }

  return { userId: decoded.userId };
}
