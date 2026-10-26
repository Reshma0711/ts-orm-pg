import { createClient } from "redis";
import { env } from "./env.config";

export const redisClient = createClient({ url: env.redisUrl ,
     RESP: 2
});

redisClient.on("error", (error) => {
  console.error("Redis connection error:", error);
});

export async function connectRedis(): Promise<void> {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};
