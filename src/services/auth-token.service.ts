import { redisClient } from "../config/redis.config";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from "../utils/jwt.util";

function accessTokenKey(userId: number): string {
  return `auth:user:${userId}:access`;
}

function refreshTokenKey(userId: number): string {
  return `auth:user:${userId}:refresh`;
}

export async function cacheAuthTokens(
  userId: number,
  accessToken: string,
  refreshToken: string
): Promise<void> {
  await redisClient
    .multi()
    .set(accessTokenKey(userId), accessToken, { EX: ACCESS_TOKEN_TTL_SECONDS })
    .set(refreshTokenKey(userId), refreshToken, { EX: REFRESH_TOKEN_TTL_SECONDS })
    .exec();
}

export async function cacheAccessToken(
  userId: number,
  accessToken: string
): Promise<void> {
  await redisClient.set(accessTokenKey(userId), accessToken, {
    EX: ACCESS_TOKEN_TTL_SECONDS,
  });
}

export async function getCachedAccessToken(
  userId: number
): Promise<string | null> {
  return redisClient.get(accessTokenKey(userId));
}

export async function getCachedRefreshToken(
  userId: number
): Promise<string | null> {
  return redisClient.get(refreshTokenKey(userId));
}

export async function clearCachedAuthTokens(userId: number): Promise<void> {
  await redisClient.del([accessTokenKey(userId), refreshTokenKey(userId)]);
}
